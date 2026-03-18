import { Callout, Card, H4, H5, Tag, Text } from '@blueprintjs/core'
import React from 'react'
import styled from 'styled-components'

import type {
  RecommendationBucket,
  RecommendationCandidate,
  RecommendationResult,
} from './types'

const Section = styled.section`
  display: grid;
  gap: 16px;
`

const SummaryRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`

const BucketSection = styled.section`
  display: grid;
  gap: 12px;
`

const BucketHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`

const CardsGrid = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
`

const CandidateCard = styled(Card)`
  display: grid;
  gap: 10px;
  border-radius: 16px;
  background: rgba(12, 20, 31, 0.9);
  border: 1px solid rgba(132, 160, 188, 0.2);
`

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

const DetailGrid = styled.div`
  display: grid;
  gap: 6px;
`

const DetailLine = styled(Text)`
  color: rgba(222, 231, 239, 0.88);
`

const SmallText = styled(Text)`
  color: rgba(178, 192, 206, 0.82);
`

type BucketMeta = {
  title: string
  intent: 'success' | 'primary' | 'warning' | 'danger'
  description: string
}

const BUCKET_META: Record<RecommendationBucket, BucketMeta> = {
  ready_now: {
    title: 'Ready Now',
    intent: 'success',
    description: '已經達標，現在就能處理的改造目標。',
  },
  near_term: {
    title: 'Near Term',
    intent: 'primary',
    description: '再幾級就到，屬於很快能收掉的短期項目。',
  },
  worth_investing: {
    title: 'Worth Investing',
    intent: 'warning',
    description: '還有一段距離，但 payoff 值得先列進訓練清單。',
  },
  blocked: {
    title: 'Blocked',
    intent: 'danger',
    description: '等級不一定是問題，但目前被素材偏好設定擋住。',
  },
}

export type RecommendationResultsProps = {
  result: RecommendationResult | null
  fileName: string | null
  warnings: string[]
  importError: string | null
}

const renderCandidate = (candidate: RecommendationCandidate) => (
  <CandidateCard key={`${candidate.shipInstanceId}:${candidate.knowledgeId}`} elevation={0}>
    <div>
      <H5 style={{ margin: 0 }}>{candidate.shipName}</H5>
      <SmallText>{candidate.shipType}</SmallText>
    </div>
    <MetaRow>
      <Tag minimal intent="none">{`Lv.${candidate.currentLevel}`}</Tag>
      <Tag minimal intent="primary">{candidate.targetName}</Tag>
      <Tag minimal intent="warning">{`目標 Lv.${candidate.targetLevel}`}</Tag>
    </MetaRow>
    <DetailGrid>
      <DetailLine>{`Level gap: ${candidate.levelGap}`}</DetailLine>
      <DetailLine>{`Blocker: ${candidate.blockerSummary}`}</DetailLine>
      <DetailLine>{candidate.primaryReason}</DetailLine>
    </DetailGrid>
  </CandidateCard>
)

export const RecommendationResults: React.FC<RecommendationResultsProps> = ({
  result,
  fileName,
  warnings,
  importError,
}) => {
  if (importError) {
    return (
      <Section>
        <Callout intent="danger" title="Import failed">
          {importError}
        </Callout>
      </Section>
    )
  }

  if (!result) {
    return (
      <Section>
        <Callout intent="primary" title="Import a CSV to begin">
          先匯入 Inventory Export 的 ship CSV，MVP 才能根據你的 roster 產生 recommendation shortlist。
        </Callout>
      </Section>
    )
  }

  return (
    <Section>
      <Callout intent="success" title="Import complete">
        {fileName ? `已讀入 ${fileName}` : 'CSV 已成功讀入。'}
      </Callout>

      {warnings.map((warning) => (
        <Callout key={warning} intent="warning" title="Partial import">
          {warning}
        </Callout>
      ))}

      <Card elevation={0}>
        <H4 style={{ marginTop: 0 }}>Roster Summary</H4>
        <SummaryRow>
          <Tag large minimal intent="none">{`總艦數 ${result.summary.totalShips}`}</Tag>
          <Tag large minimal intent="success">{`可評估 ${result.summary.coveredShips}`}</Tag>
          <Tag large minimal intent="warning">{`未覆蓋 ${result.summary.uncoveredShips}`}</Tag>
          <Tag large minimal intent="primary">{`Shortlist ${result.summary.shortlistedShips}`}</Tag>
        </SummaryRow>
      </Card>

      {result.summary.coveredShips === 0 ? (
        <Callout intent="warning" title="No covered candidates">
          這份 roster 已成功讀入，但目前 knowledge base 還沒有覆蓋到可推薦的改造目標。
        </Callout>
      ) : null}

      {(['ready_now', 'near_term', 'worth_investing', 'blocked'] as RecommendationBucket[]).map(
        (bucket) => {
          const candidates = result.buckets[bucket]
          const meta = BUCKET_META[bucket]

          if (candidates.length === 0) {
            return null
          }

          return (
            <BucketSection key={bucket}>
              <BucketHeader>
                <div>
                  <H4 style={{ margin: 0 }}>{meta.title}</H4>
                  <SmallText>{meta.description}</SmallText>
                </div>
                <Tag large minimal intent={meta.intent}>{candidates.length}</Tag>
              </BucketHeader>
              <CardsGrid>{candidates.map(renderCandidate)}</CardsGrid>
            </BucketSection>
          )
        },
      )}
    </Section>
  )
}
