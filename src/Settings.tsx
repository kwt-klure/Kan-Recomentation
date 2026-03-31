import { H5, Text } from '@blueprintjs/core'
import React, { StrictMode } from 'react'
import styled from 'styled-components'

import PKG from '../package.json'
import { KNOWLEDGE_SNAPSHOT_METADATA } from './recommendation/knowledge'

const Container = styled.div`
  display: grid;
  gap: 12px;
  padding: 16px;
  user-select: text;
`

const Muted = styled(Text)`
  color: #586779;
`

export const SettingsMain = () => (
  <Container>
    <H5 style={{ margin: 0 }}>Kan-Recomentation</H5>
    <Muted>根據 roster CSV 與素材限制，整理下一批值得練的改造目標。</Muted>
    <Text>{`Version ${PKG.version}`}</Text>
    <Text>{`Knowledge Snapshot ${KNOWLEDGE_SNAPSHOT_METADATA.snapshotVersion}`}</Text>
    <Muted>資料來源在 build-time 整併成固定 snapshot，plugin runtime 不會直接抓外部網站。</Muted>
    {KNOWLEDGE_SNAPSHOT_METADATA.preferredUpstreams.map((upstream) => (
      <Text key={upstream.id}>
        {`${upstream.priority}. ${upstream.displayName} · ${upstream.locale} · ${upstream.role === 'primary' ? '主來源' : '備援'}`}
      </Text>
    ))}
    {KNOWLEDGE_SNAPSHOT_METADATA.sources.map((source) => (
      <Text key={source.id}>
        {`${source.displayName} · ${source.updatedOn} · ${source.entryCount} entries`}
      </Text>
    ))}
  </Container>
)

export const Settings = () => (
  <StrictMode>
    <SettingsMain />
  </StrictMode>
)
