import { H5, Text } from '@blueprintjs/core'
import React, { StrictMode } from 'react'
import styled from 'styled-components'

import PKG from '../package.json'

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
  </Container>
)

export const Settings = () => (
  <StrictMode>
    <SettingsMain />
  </StrictMode>
)
