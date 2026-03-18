import {
  Button,
  Callout,
  H3,
  H5,
  Switch,
  Tag,
  Text,
} from '@blueprintjs/core'
import { IconNames } from '@blueprintjs/icons'
import React, {
  StrictMode,
  useCallback,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react'
import styled from 'styled-components'

import { importRosterFromCsvText, InventoryCsvParseError } from './recommendation/csv'
import { buildRecommendationResult } from './recommendation/engine'
import { DEFAULT_MATERIAL_CONSTRAINTS } from './recommendation/knowledge'
import { RecommendationResults } from './recommendation/view'
import type { MaterialConstraintState, RosterShip } from './recommendation/types'

const Page = styled.div`
  min-height: 100%;
  padding: 24px;
  background: linear-gradient(180deg, #10161d 0%, #16212d 100%);
  color: #eef2f6;
`

const Shell = styled.div`
  display: grid;
  gap: 16px;
  width: min(860px, 100%);
  margin: 0 auto;
`

const Card = styled.div`
  display: grid;
  gap: 12px;
  padding: 20px;
  border: 1px solid rgba(148, 177, 204, 0.2);
  border-radius: 16px;
  background: rgba(14, 23, 35, 0.82);
`

const Panel = styled.div`
  display: grid;
  gap: 16px;
`

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`

const HiddenInput = styled.input`
  display: none;
`

const ConstraintGrid = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
`

const Muted = styled(Text)`
  color: rgba(214, 224, 234, 0.78);
`

type ConstraintKey = keyof MaterialConstraintState

const CONSTRAINT_FIELDS: Array<{
  key: ConstraintKey
  label: string
  help: string
}>
 = [
  {
    key: 'acceptBlueprintCost',
    label: '接受藍圖成本',
    help: '允許把需要改裝設計圖的目標列為可行。',
  },
  {
    key: 'acceptCatapultCost',
    label: '接受甲板彈射器成本',
    help: '允許把需要試製甲板カタパルト的目標列為可行。',
  },
  {
    key: 'acceptActionReportCost',
    label: '接受戰鬥詳報成本',
    help: '允許需要戰鬥詳報的後段改造進入可行清單。',
  },
  {
    key: 'acceptOtherRareMaterials',
    label: '接受其他稀有素材',
    help: '例如新型兵裝資材等額外稀有材料。',
  },
]

const getImportErrorMessage = (error: unknown) => {
  if (error instanceof InventoryCsvParseError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'CSV 讀取失敗，請確認檔案格式是否正確。'
}

export const AppMain: React.FC = () => {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [rosterShips, setRosterShips] = useState<RosterShip[]>([])
  const [fileName, setFileName] = useState<string | null>(null)
  const [importWarnings, setImportWarnings] = useState<string[]>([])
  const [importError, setImportError] = useState<string | null>(null)
  const [constraints, setConstraints] = useState<MaterialConstraintState>(
    DEFAULT_MATERIAL_CONSTRAINTS,
  )
  const [isPending, startTransition] = useTransition()

  const result = useMemo(
    () =>
      rosterShips.length > 0
        ? buildRecommendationResult(rosterShips, constraints)
        : null,
    [constraints, rosterShips],
  )

  const handleConstraintChange = useCallback((key: ConstraintKey) => {
    setConstraints((current) => ({
      ...current,
      [key]: !current[key],
    }))
  }, [])

  const handleFileSelected = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.currentTarget.files?.[0]
      event.currentTarget.value = ''

      if (!file) {
        return
      }

      try {
        const text = await file.text()
        const importResult = importRosterFromCsvText(text)

        setImportError(null)
        startTransition(() => {
          setFileName(file.name)
          setImportWarnings(importResult.warnings)
          setRosterShips(importResult.rosterShips)
        })
      } catch (error) {
        console.error(error)
        setFileName(file.name)
        setImportWarnings([])
        setRosterShips([])
        setImportError(getImportErrorMessage(error))
      }
    },
    [],
  )

  return (
    <Page>
      <Shell>
        <Card>
          <H3 style={{ margin: 0 }}>Kan-Recomentation</H3>
          <Muted>
            這個 MVP 會讀取 Inventory Export 的 ship CSV，根據 roster 與素材偏好整理出下一批值得練的改造目標。
          </Muted>
        </Card>

        <Callout intent="primary" title="MVP Scope">
          目前只支援 Inventory Export CSV。系統會全船解析，但只有 knowledge base 已覆蓋的條目會進入 recommendation shortlist。
        </Callout>

        <Panel>
          <Card>
            <H5 style={{ marginTop: 0 }}>1. 匯入 Roster CSV</H5>
            <Muted>
              需要的欄位至少包含 `艦 ID`、`艦名`、`艦種`、`等級`、`後續改造`。這份 MVP 會把每艘實例艦個別評估。
            </Muted>
            <Actions>
              <Button
                icon={IconNames.UPLOAD}
                intent="primary"
                text={isPending ? '正在整理 roster...' : '選擇 ship CSV'}
                loading={isPending}
                onClick={() => inputRef.current?.click()}
              />
              {fileName ? <Tag large minimal>{fileName}</Tag> : null}
            </Actions>
            <HiddenInput
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileSelected}
            />
          </Card>

          <Card>
            <H5 style={{ marginTop: 0 }}>2. 素材限制</H5>
            <ConstraintGrid>
              {CONSTRAINT_FIELDS.map((field) => (
                <Switch
                  key={field.key}
                  checked={constraints[field.key]}
                  label={field.label}
                  innerLabelChecked="On"
                  innerLabel="Off"
                  onChange={() => handleConstraintChange(field.key)}
                >
                  {field.help}
                </Switch>
              ))}
            </ConstraintGrid>
          </Card>

          <RecommendationResults
            fileName={fileName}
            importError={importError}
            result={result}
            warnings={importWarnings}
          />
        </Panel>
      </Shell>
    </Page>
  )
}

export const App = () => (
  <StrictMode>
    <AppMain />
  </StrictMode>
)
