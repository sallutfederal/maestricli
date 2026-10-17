# Mapa de canais IPC - Maestri

Gerado por `tools/ipc-map.mjs`. Nada foi executado: tudo vem de leitura estatica.

- Canais declarados no preload: **445**
- Implementacao localizada no main: **444** (99.8%)
- renderer -> main: **395** `(handle)` / `(on)`
- main -> renderer: **46** `(send)` / `(emit)`
- via alias (direcao indeterminada): **3**
- nao localizada: **1**

| Namespace | Canais | handle | on | send | emit | alias | s/ impl. |
|---|---|---|---|---|---|---|---|
| pullRequests | 36 | 33 | 1 | 0 | 2 | 0 | 0 |
| fileTree | 35 | 29 | 0 | 0 | 6 | 0 | 0 |
| workspace | 29 | 25 | 0 | 0 | 3 | 1 | 0 |
| chat | 28 | 26 | 1 | 0 | 1 | 0 | 0 |
| accounts | 27 | 23 | 1 | 0 | 3 | 0 | 0 |
| floor | 26 | 23 | 0 | 0 | 3 | 0 | 0 |
| terminal | 22 | 12 | 3 | 1 | 6 | 0 | 0 |
| app | 19 | 15 | 3 | 0 | 0 | 0 | 1 |
| remote | 18 | 12 | 1 | 0 | 5 | 0 | 0 |
| data | 16 | 15 | 0 | 0 | 1 | 0 | 0 |
| noteStack | 16 | 15 | 1 | 0 | 0 | 0 | 0 |
| note | 14 | 13 | 0 | 0 | 1 | 0 | 0 |
| agent | 13 | 13 | 0 | 0 | 0 | 0 | 0 |
| floorHooks | 13 | 11 | 0 | 0 | 2 | 0 | 0 |
| connection | 12 | 11 | 0 | 0 | 1 | 0 | 0 |
| routine | 11 | 9 | 0 | 0 | 2 | 0 | 0 |
| partitura | 10 | 8 | 0 | 0 | 1 | 1 | 0 |
| portal | 8 | 6 | 0 | 2 | 0 | 0 | 0 |
| agentUsage | 7 | 5 | 1 | 0 | 1 | 0 | 0 |
| device | 7 | 5 | 1 | 1 | 0 | 0 | 0 |
| files | 7 | 7 | 0 | 0 | 0 | 0 | 0 |
| license | 7 | 6 | 0 | 0 | 1 | 0 | 0 |
| node | 7 | 7 | 0 | 0 | 0 | 0 | 0 |
| prompter | 7 | 7 | 0 | 0 | 0 | 0 | 0 |
| drawing | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| gitHosts | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| preferences | 5 | 2 | 2 | 0 | 0 | 1 | 0 |
| windowControls | 5 | 4 | 0 | 1 | 0 | 0 | 0 |
| cableTie | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| group | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| portalDesign | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| updates | 4 | 3 | 0 | 0 | 1 | 0 | 0 |
| appState | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| sidebarLayout | 3 | 2 | 0 | 0 | 1 | 0 | 0 |
| clipboard | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| codex | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| floorSnapshot | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| interAgent | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| palette | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| snapNode | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| tidyNode | 1 | 1 | 0 | 0 | 0 | 0 | 0 |

## Detalhe por canal

`decl` = linha da constante de canal em `main/deobfuscated.js`;
`impl` = linha da implementacao encontrada.

| canal | direcao | tipo | decl | impl |
|---|---|---|---|---|
| `maestri:accounts:add` | renderer->main | handle | 59996 | 61592 |
| `maestri:accounts:addApiKey` | renderer->main | handle | 59997 | 61603 |
| `maestri:accounts:approveProvider` | renderer->main | handle | 60017 | 61678 |
| `maestri:accounts:describe` | renderer->main | handle | 60011 | 61683 |
| `maestri:accounts:keepsSessionAlive` | renderer->main | handle | 60009 | 61667 |
| `maestri:accounts:moveToDefault` | renderer->main | handle | 60003 | 61641 |
| `maestri:accounts:onChanged` | main->renderer | emit | 60012 | 62979 |
| `maestri:accounts:onProvidersChanged` | main->renderer | emit | 60016 | 62981 |
| `maestri:accounts:onSignedIn` | main->renderer | emit | 60013 | 62980 |
| `maestri:accounts:providers` | renderer->main | handle | 60014 | 61676 |
| `maestri:accounts:refresh` | renderer->main | handle | 60006 | 61656 |
| `maestri:accounts:refreshPlace` | renderer->main | handle | 60007 | 61657 |
| `maestri:accounts:remove` | renderer->main | handle | 60002 | 61638 |
| `maestri:accounts:rename` | renderer->main | handle | 60001 | 61633 |
| `maestri:accounts:replaceKey` | renderer->main | handle | 59998 | 61619 |
| `maestri:accounts:restoreBuiltInProviders` | renderer->main | handle | 60018 | 61679 |
| `maestri:accounts:restoreProvider` | renderer->main | handle | 60019 | 61680 |
| `maestri:accounts:revealProviderFile` | renderer->main | handle | 60021 | 61682 |
| `maestri:accounts:revealProvidersFolder` | renderer->main | handle | 60020 | 61681 |
| `maestri:accounts:setEndpoint` | renderer->main | handle | 59999 | 61623 |
| `maestri:accounts:setProvidersViewer` | renderer->main | on | 60015 | 61677 |
| `maestri:accounts:setTerminal` | renderer->main | handle | 60010 | 61668 |
| `maestri:accounts:signOut` | renderer->main | handle | 60000 | 61628 |
| `maestri:accounts:signOutAll` | renderer->main | handle | 60008 | 61663 |
| `maestri:accounts:view` | renderer->main | handle | 59995 | 61536 |
| `maestri:accounts:watchSignIn` | renderer->main | handle | 60004 | 61646 |
| `maestri:accounts:watchSignOut` | renderer->main | handle | 60005 | 61651 |
| `maestri:agent:assignRole` | renderer->main | handle | 59961 | 61185 |
| `maestri:agent:createSandbox` | renderer->main | handle | 59972 | 61231 |
| `maestri:agent:directorySuggestions` | renderer->main | handle | 59967 | 61193 |
| `maestri:agent:discoverRoles` | renderer->main | handle | 59965 | 61213 |
| `maestri:agent:listDockerContainers` | renderer->main | handle | 59968 | 61222 |
| `maestri:agent:listSandboxAgents` | renderer->main | handle | 59971 | 61230 |
| `maestri:agent:listSandboxes` | renderer->main | handle | 59970 | 61229 |
| `maestri:agent:listShells` | renderer->main | handle | 59963 | 61194 |
| `maestri:agent:listWslDistros` | renderer->main | handle | 59962 | 61186 |
| `maestri:agent:locateLocalTmux` | renderer->main | handle | 59964 | 61212 |
| `maestri:agent:testDockerConnection` | renderer->main | handle | 59969 | 61223 |
| `maestri:agent:testSandboxConnection` | renderer->main | handle | 59973 | 61232 |
| `maestri:agent:validateWslDirectory` | renderer->main | handle | 59966 | 61233 |
| `maestri:agentUsage:getState` | renderer->main | handle | 60155 | 62492 |
| `maestri:agentUsage:onStateChanged` | main->renderer | emit | 60161 | 62987 |
| `maestri:agentUsage:refresh` | renderer->main | handle | 60156 | 62493 |
| `maestri:agentUsage:refreshAll` | renderer->main | handle | 60157 | 62494 |
| `maestri:agentUsage:restoreDefaults` | renderer->main | handle | 60158 | 62495 |
| `maestri:agentUsage:revealProvidersFolder` | renderer->main | handle | 60159 | 62503 |
| `maestri:agentUsage:setViewer` | renderer->main | on | 60160 | 62504 |
| `maestri:app:createDirectory` | renderer->main | handle | 59828 | 61191 |
| `maestri:app:diagnosticReport` | renderer->main | handle | 59822 | 60450 |
| `maestri:app:directoryState` | renderer->main | handle | 59827 | 61190 |
| `maestri:app:hideToTray` | renderer->main | handle | 59830 | 60486 |
| `maestri:app:info` | renderer->main | handle | 59820 | 60432 |
| `maestri:app:listIdes` | renderer->main | handle | 59836 | 60507 |
| `maestri:app:localDirectorySuggestions` | renderer->main | handle | 59826 | 61192 |
| `maestri:app:openExternal` | renderer->main | handle | 60077 | 62126 |
| `maestri:app:openInIde` | renderer->main | handle | 59837 | 60508 |
| `maestri:app:openPath` | renderer->main | handle | 60078 | 62127 |
| `maestri:app:pickDirectory` | renderer->main | handle | 59825 | 60472 |
| `maestri:app:quit` | renderer->main | handle | 59829 | 60485 |
| `maestri:app:rendererBooted` | renderer->main | on | 59839 | 60529 |
| `maestri:app:rendererFault` | renderer->main | on | 59840 | 60536 |
| `maestri:app:saveDiagnosticReport` | renderer->main | handle | 59823 | 60451 |
| `maestri:app:setLocale` | renderer->main | handle | 59824 | 60469 |
| `maestri:app:showEmojiPanel` | renderer->main | handle | 59838 | 60525 |
| `maestri:app:shutdown` | — | — | 59841 | — |
| `maestri:app:shutdownPainted` | renderer->main | on | 59842 | 60540 |
| `maestri:appState:get` | renderer->main | handle | 59843 | 60541 |
| `maestri:appState:setHasSeenFloorOnboarding` | renderer->main | handle | 59845 | 60546 |
| `maestri:appState:setOnboardingCompleted` | renderer->main | handle | 59844 | 60545 |
| `maestri:cableTie:create` | renderer->main | handle | 60098 | 62179 |
| `maestri:cableTie:delete` | renderer->main | handle | 60100 | 62185 |
| `maestri:cableTie:move` | renderer->main | handle | 60099 | 62182 |
| `maestri:cableTie:prune` | renderer->main | handle | 60101 | 62188 |
| `maestri:chat:acknowledgeAttention` | renderer->main | handle | 60145 | 62473 |
| `maestri:chat:askNames` | renderer->main | handle | 60203 | 62479 |
| `maestri:chat:attachmentFacts` | renderer->main | handle | 60152 | 62486 |
| `maestri:chat:cancelSearchHistory` | renderer->main | handle | 60138 | 62462 |
| `maestri:chat:captureArchives` | renderer->main | handle | 60204 | 62480 |
| `maestri:chat:clearThread` | renderer->main | handle | 60148 | 62476 |
| `maestri:chat:conversation` | renderer->main | handle | 60134 | 62445 |
| `maestri:chat:copyChats` | renderer->main | handle | 60205 | 62481 |
| `maestri:chat:deleteAttachment` | renderer->main | handle | 60150 | 62478 |
| `maestri:chat:deleteEntry` | renderer->main | handle | 60149 | 62477 |
| `maestri:chat:discardCopiedChats` | renderer->main | handle | 60206 | 62482 |
| `maestri:chat:enter` | renderer->main | handle | 60140 | 62466 |
| `maestri:chat:exit` | renderer->main | handle | 60141 | 62467 |
| `maestri:chat:interrupt` | renderer->main | handle | 60144 | 62472 |
| `maestri:chat:loadHistoryBackTo` | renderer->main | handle | 60136 | 62447 |
| `maestri:chat:loadOlderHistory` | renderer->main | handle | 60135 | 62446 |
| `maestri:chat:markRead` | renderer->main | handle | 60146 | 62474 |
| `maestri:chat:onConversationEvent` | main->renderer | emit | 60151 | 62986 |
| `maestri:chat:openAttachment` | renderer->main | handle | 60153 | 62487 |
| `maestri:chat:releaseConversationSearch` | renderer->main | handle | 60209 | 62485 |
| `maestri:chat:searchConversations` | renderer->main | handle | 60208 | 62484 |
| `maestri:chat:searchHistory` | renderer->main | handle | 60137 | 62449 |
| `maestri:chat:send` | renderer->main | handle | 60143 | 62471 |
| `maestri:chat:sendComposedPrompt` | renderer->main | handle | 60207 | 62483 |
| `maestri:chat:setShowsShellWindowDuringTurns` | renderer->main | handle | 60142 | 62468 |
| `maestri:chat:startAttachmentDrag` | renderer->main | on | 60154 | 62491 |
| `maestri:chat:switchThread` | renderer->main | handle | 60147 | 62475 |
| `maestri:chat:threads` | renderer->main | handle | 60139 | 62465 |
| `maestri:clipboard:writeImage` | renderer->main | handle | 60076 | 62113 |
| `maestri:codex:isMissingFlag` | renderer->main | handle | 59821 | 61739 |
| `maestri:connection:createCrossFloor` | renderer->main | handle | 60092 | 62158 |
| `maestri:connection:createNote` | renderer->main | handle | 60088 | 62153 |
| `maestri:connection:createNoteToNote` | renderer->main | handle | 60089 | 62155 |
| `maestri:connection:createPortal` | renderer->main | handle | 60090 | 62156 |
| `maestri:connection:createPortalToPortal` | renderer->main | handle | 60091 | 62157 |
| `maestri:connection:createTerminal` | renderer->main | handle | 60087 | 62133 |
| `maestri:connection:delete` | renderer->main | handle | 60097 | 62172 |
| `maestri:connection:deleteMany` | renderer->main | handle | 60102 | 62175 |
| `maestri:connection:transferActive` | main->renderer | emit | 60103 | 62983 |
| `maestri:connection:turnFileIntoNote` | renderer->main | handle | 60093 | 62154 |
| `maestri:connection:updateRopePoints` | renderer->main | handle | 60094 | 62166 |
| `maestri:connection:updateRopePointsMany` | renderer->main | handle | 60096 | 62169 |
| `maestri:data:backupNow` | renderer->main | handle | 60222 | 62840 |
| `maestri:data:clearGlobalPortalStorage` | renderer->main | handle | 60227 | 62883 |
| `maestri:data:deleteAll` | renderer->main | handle | 60218 | 62836 |
| `maestri:data:deleteBackup` | renderer->main | handle | 60223 | 62841 |
| `maestri:data:exportBackup` | renderer->main | handle | 60224 | 62842 |
| `maestri:data:importBackup` | renderer->main | handle | 60226 | 62882 |
| `maestri:data:lastBackupAt` | renderer->main | handle | 60220 | 62838 |
| `maestri:data:lastSaveAt` | renderer->main | handle | 60221 | 62839 |
| `maestri:data:listBackups` | renderer->main | handle | 60219 | 62837 |
| `maestri:data:moveStorage` | renderer->main | handle | 60216 | 62818 |
| `maestri:data:onStoreReloaded` | main->renderer | emit | 60228 | 63023 |
| `maestri:data:pickBackupToImport` | renderer->main | handle | 60225 | 62860 |
| `maestri:data:revealBackupsLocation` | renderer->main | handle | 60215 | 62817 |
| `maestri:data:revealStorageLocation` | renderer->main | handle | 60214 | 62816 |
| `maestri:data:storageLocation` | renderer->main | handle | 60213 | 62815 |
| `maestri:data:usage` | renderer->main | handle | 60217 | 62835 |
| `maestri:device:automation` | renderer->main | handle | 60118 | 62246 |
| `maestri:device:contract` | renderer->main | handle | 60116 | 62244 |
| `maestri:device:discover` | renderer->main | handle | 60117 | 62245 |
| `maestri:device:frameCaptureRequest` | main->renderer | send | 60120 | 101894 |
| `maestri:device:frameCaptureResult` | renderer->main | handle | 60121 | 62247 |
| `maestri:device:sessionsPublish` | renderer->main | handle | 60122 | 62261 |
| `maestri:device:streamTransfer` | renderer->main | on | 60119 | 62296 |
| `maestri:drawing:create` | renderer->main | handle | 59974 | 61277 |
| `maestri:drawing:delete` | renderer->main | handle | 59977 | 61293 |
| `maestri:drawing:group` | renderer->main | handle | 59978 | 61296 |
| `maestri:drawing:patch` | renderer->main | handle | 59976 | 61285 |
| `maestri:drawing:recognize` | renderer->main | handle | 59975 | 61276 |
| `maestri:drawing:ungroup` | renderer->main | handle | 59979 | 61302 |
| `maestri:files:clipboardFilePaths` | renderer->main | handle | 60075 | 62112 |
| `maestri:files:openAttachment` | renderer->main | handle | 60070 | 62084 |
| `maestri:files:resolveLocalPath` | renderer->main | handle | 60073 | 62110 |
| `maestri:files:revealAttachment` | renderer->main | handle | 60071 | 62096 |
| `maestri:files:revealPath` | renderer->main | handle | 60072 | 62109 |
| `maestri:files:stagePastedImage` | renderer->main | handle | 60074 | 62111 |
| `maestri:files:storeAttachment` | renderer->main | handle | 60069 | 62083 |
| `maestri:fileTree:attachCheckout` | renderer->main | handle | 60037 | 62013 |
| `maestri:fileTree:cancelSearch` | renderer->main | handle | 60046 | 62042 |
| `maestri:fileTree:copyPath` | renderer->main | handle | 60059 | 62056 |
| `maestri:fileTree:fileClipboard` | renderer->main | handle | 60068 | 62014 |
| `maestri:fileTree:fileOperation` | renderer->main | handle | 60067 | 62015 |
| `maestri:fileTree:gitAction` | renderer->main | handle | 60040 | 62037 |
| `maestri:fileTree:gitBranches` | renderer->main | handle | 60052 | 62050 |
| `maestri:fileTree:gitCancel` | renderer->main | handle | 60042 | 62039 |
| `maestri:fileTree:gitChanges` | renderer->main | handle | 60041 | 62038 |
| `maestri:fileTree:gitCommitBody` | renderer->main | handle | 60051 | 62049 |
| `maestri:fileTree:gitDiffFiles` | renderer->main | handle | 60048 | 62046 |
| `maestri:fileTree:gitFileDiff` | renderer->main | handle | 60049 | 62047 |
| `maestri:fileTree:gitHistory` | renderer->main | handle | 60050 | 62048 |
| `maestri:fileTree:gitIndexLock` | renderer->main | handle | 60043 | 62040 |
| `maestri:fileTree:gitMergePreview` | renderer->main | handle | 60054 | 62052 |
| `maestri:fileTree:gitStashes` | renderer->main | handle | 60053 | 62051 |
| `maestri:fileTree:gitState` | renderer->main | handle | 60039 | 62036 |
| `maestri:fileTree:list` | renderer->main | handle | 60034 | 62010 |
| `maestri:fileTree:onDidChange` | main->renderer | emit | 60038 | 62030 |
| `maestri:fileTree:onFileChanged` | main->renderer | emit | 60058 | 63008 |
| `maestri:fileTree:onGitActionProgress` | main->renderer | emit | 60061 | 63007 |
| `maestri:fileTree:onGitState` | main->renderer | emit | 60066 | 63005 |
| `maestri:fileTree:onSearchResults` | main->renderer | emit | 60047 | 63009 |
| `maestri:fileTree:onWatchState` | main->renderer | emit | 60065 | 63006 |
| `maestri:fileTree:probeMedia` | renderer->main | handle | 60057 | 62055 |
| `maestri:fileTree:readFile` | renderer->main | handle | 60055 | 62053 |
| `maestri:fileTree:retryWatch` | renderer->main | handle | 60064 | 62067 |
| `maestri:fileTree:reveal` | renderer->main | handle | 60062 | 62068 |
| `maestri:fileTree:revealFile` | renderer->main | handle | 60060 | 62057 |
| `maestri:fileTree:searchContents` | renderer->main | handle | 60044 | 62041 |
| `maestri:fileTree:searchFilenames` | renderer->main | handle | 60045 | 62045 |
| `maestri:fileTree:unwatch` | renderer->main | handle | 60036 | 62012 |
| `maestri:fileTree:watch` | renderer->main | handle | 60035 | 62011 |
| `maestri:fileTree:watchState` | renderer->main | handle | 60063 | 62066 |
| `maestri:fileTree:writeFile` | renderer->main | handle | 60056 | 62054 |
| `maestri:floor:cancelIsolated` | renderer->main | handle | 59904 | 60891 |
| `maestri:floor:canCopy` | renderer->main | handle | 59895 | 60793 |
| `maestri:floor:create` | renderer->main | handle | 59897 | 60804 |
| `maestri:floor:createIsolated` | renderer->main | handle | 59898 | 60832 |
| `maestri:floor:createKind` | renderer->main | handle | 59896 | 60780 |
| `maestri:floor:delete` | renderer->main | handle | 59909 | 60905 |
| `maestri:floor:isolationAvailable` | renderer->main | handle | 59894 | 60797 |
| `maestri:floor:land` | renderer->main | handle | 59914 | 60965 |
| `maestri:floor:landingFileDiff` | renderer->main | handle | 59913 | 60956 |
| `maestri:floor:landingPreflight` | renderer->main | handle | 59911 | 60934 |
| `maestri:floor:landingPreview` | renderer->main | handle | 59912 | 60947 |
| `maestri:floor:landingRemoveBranch` | renderer->main | handle | 59915 | 60996 |
| `maestri:floor:listBranches` | renderer->main | handle | 59905 | 60887 |
| `maestri:floor:onLanding` | main->renderer | emit | 59916 | 62991 |
| `maestri:floor:onRemovingChanged` | main->renderer | emit | 59917 | 62992 |
| `maestri:floor:removeBranch` | renderer->main | handle | 59910 | 60924 |
| `maestri:floor:removing` | renderer->main | handle | 59918 | 60986 |
| `maestri:floor:rename` | renderer->main | handle | 59907 | 60894 |
| `maestri:floor:reviewCreate` | renderer->main | handle | 59903 | 60817 |
| `maestri:floor:reviewList` | renderer->main | handle | 59899 | 60815 |
| `maestri:floor:reviewName` | renderer->main | handle | 59902 | 60816 |
| `maestri:floor:reviewNumber` | renderer->main | handle | 59900 | 60814 |
| `maestri:floor:reviewSource` | renderer->main | handle | 59901 | 60813 |
| `maestri:floor:seedProgress` | main->renderer | emit | 59906 | 60823 |
| `maestri:floor:switch` | renderer->main | handle | 59908 | 60897 |
| `maestri:floor:testLanding` | renderer->main | handle | 59919 | 60987 |
| `maestri:floorHooks:clearAllResults` | renderer->main | handle | 59927 | 61075 |
| `maestri:floorHooks:clearResult` | renderer->main | handle | 59926 | 61072 |
| `maestri:floorHooks:get` | renderer->main | handle | 59921 | 61044 |
| `maestri:floorHooks:onOutput` | main->renderer | emit | 59931 | 62993 |
| `maestri:floorHooks:onRunsChanged` | main->renderer | emit | 59929 | 62988 |
| `maestri:floorHooks:readOutput` | renderer->main | handle | 59930 | 61079 |
| `maestri:floorHooks:replace` | renderer->main | handle | 59922 | 61045 |
| `maestri:floorHooks:resize` | renderer->main | handle | 59933 | 61083 |
| `maestri:floorHooks:run` | renderer->main | handle | 59923 | 61046 |
| `maestri:floorHooks:runs` | renderer->main | handle | 59928 | 61078 |
| `maestri:floorHooks:runSection` | renderer->main | handle | 59925 | 61062 |
| `maestri:floorHooks:stop` | renderer->main | handle | 59924 | 61059 |
| `maestri:floorHooks:write` | renderer->main | handle | 59932 | 61080 |
| `maestri:floorSnapshot:capture` | renderer->main | handle | 59920 | 60997 |
| `maestri:gitHosts:checkAccount` | renderer->main | handle | 60165 | 62511 |
| `maestri:gitHosts:configure` | renderer->main | handle | 60162 | 62508 |
| `maestri:gitHosts:restoreDefault` | renderer->main | handle | 60163 | 62509 |
| `maestri:gitHosts:restoreMissingDefaults` | renderer->main | handle | 60164 | 62510 |
| `maestri:gitHosts:revealProvidersFolder` | renderer->main | handle | 60166 | 62512 |
| `maestri:group:create` | renderer->main | handle | 59941 | 61131 |
| `maestri:group:rename` | renderer->main | handle | 59943 | 61140 |
| `maestri:group:setColor` | renderer->main | handle | 59944 | 61143 |
| `maestri:group:ungroup` | renderer->main | handle | 59942 | 61137 |
| `maestri:interAgent:listPeers` | renderer->main | handle | 60123 | 62297 |
| `maestri:license:activate` | renderer->main | handle | 60230 | 62885 |
| `maestri:license:clearFreeWorkspace` | renderer->main | handle | 60233 | 62888 |
| `maestri:license:deactivate` | renderer->main | handle | 60231 | 62886 |
| `maestri:license:get` | renderer->main | handle | 60229 | 62884 |
| `maestri:license:onChanged` | main->renderer | emit | 60235 | 63013 |
| `maestri:license:selectFreeWorkspace` | renderer->main | handle | 60232 | 62887 |
| `maestri:license:setDevOverride` | renderer->main | handle | 60234 | 62889 |
| `maestri:node:create` | renderer->main | handle | 59934 | 61107 |
| `maestri:node:delete` | renderer->main | handle | 59937 | 61305 |
| `maestri:node:deleteMany` | renderer->main | handle | 59938 | 61306 |
| `maestri:node:patch` | renderer->main | handle | 59935 | 61115 |
| `maestri:node:patchFrames` | renderer->main | handle | 59936 | 61128 |
| `maestri:node:setRedacted` | renderer->main | handle | 59940 | 61372 |
| `maestri:node:unload` | renderer->main | handle | 59939 | 61371 |
| `maestri:note:attachImage` | renderer->main | handle | 60031 | 62007 |
| `maestri:note:createFromFile` | renderer->main | handle | 60084 | 61989 |
| `maestri:note:createFromRemoteFile` | renderer->main | handle | 60085 | 61990 |
| `maestri:note:edit` | renderer->main | handle | 60030 | 61954 |
| `maestri:note:mediaDir` | renderer->main | handle | 60032 | 62008 |
| `maestri:note:moveToExternal` | renderer->main | handle | 60082 | 61966 |
| `maestri:note:moveToManaged` | renderer->main | handle | 60083 | 61988 |
| `maestri:note:notesDir` | renderer->main | handle | 60033 | 62009 |
| `maestri:note:onChange` | main->renderer | emit | 60080 | 62996 |
| `maestri:note:read` | renderer->main | handle | 60028 | 61950 |
| `maestri:note:refreshFromRemoteFile` | renderer->main | handle | 60086 | 62004 |
| `maestri:note:rename` | renderer->main | handle | 60079 | 62132 |
| `maestri:note:reveal` | renderer->main | handle | 60081 | 61957 |
| `maestri:note:write` | renderer->main | handle | 60029 | 61951 |
| `maestri:noteStack:addNotes` | renderer->main | handle | 59947 | 61148 |
| `maestri:noteStack:addPage` | renderer->main | handle | 59948 | 61151 |
| `maestri:noteStack:clearCustomName` | renderer->main | handle | 59955 | 61172 |
| `maestri:noteStack:create` | renderer->main | handle | 59945 | 61146 |
| `maestri:noteStack:deleteKeepingNotes` | renderer->main | handle | 59951 | 61160 |
| `maestri:noteStack:fileDroppedNote` | renderer->main | handle | 59956 | 61175 |
| `maestri:noteStack:fileSelection` | renderer->main | handle | 59946 | 61147 |
| `maestri:noteStack:moveBetween` | renderer->main | handle | 59957 | 61178 |
| `maestri:noteStack:moveMember` | renderer->main | handle | 59952 | 61163 |
| `maestri:noteStack:rename` | renderer->main | handle | 59954 | 61169 |
| `maestri:noteStack:setEngaged` | renderer->main | on | 59960 | 61949 |
| `maestri:noteStack:setFront` | renderer->main | handle | 59953 | 61166 |
| `maestri:noteStack:setNoteColor` | renderer->main | handle | 59959 | 61182 |
| `maestri:noteStack:spill` | renderer->main | handle | 59949 | 61156 |
| `maestri:noteStack:toggleUniformColor` | renderer->main | handle | 59958 | 61179 |
| `maestri:noteStack:unstack` | renderer->main | handle | 59950 | 61157 |
| `maestri:palette:rank` | renderer->main | handle | 60126 | 62309 |
| `maestri:partitura:changed` | main->renderer | emit | 59863 | 63012 |
| `maestri:partitura:delete` | renderer->main | handle | 59857 | 62719 |
| `maestri:partitura:exportAll` | renderer->main | handle | 59859 | 62753 |
| `maestri:partitura:exportOne` | renderer->main | handle | 59858 | 62720 |
| `maestri:partitura:list` | renderer->main | handle | 59855 | 62704 |
| `maestri:partitura:openRequested` | — | alias | 59864 | 101512 |
| `maestri:partitura:pickFiles` | renderer->main | handle | 59860 | 62785 |
| `maestri:partitura:readFiles` | renderer->main | handle | 59861 | 62802 |
| `maestri:partitura:readOpenedFiles` | renderer->main | handle | 59862 | 62803 |
| `maestri:partitura:save` | renderer->main | handle | 59856 | 62705 |
| `maestri:portal:directoryIndex` | renderer->main | handle | 60108 | 62198 |
| `maestri:portal:fileChanged` | main->renderer | send | 60111 | 62206 |
| `maestri:portal:register` | renderer->main | handle | 60104 | 62191 |
| `maestri:portal:resolveSource` | renderer->main | handle | 60107 | 62197 |
| `maestri:portal:unregister` | renderer->main | handle | 60106 | 62194 |
| `maestri:portal:unwatchFile` | renderer->main | handle | 60110 | 62213 |
| `maestri:portal:wake` | main->renderer | send | 60105 | 101617 |
| `maestri:portal:watchFile` | renderer->main | handle | 60109 | 62208 |
| `maestri:portalDesign:capture` | renderer->main | handle | 60112 | 62218 |
| `maestri:portalDesign:pick` | renderer->main | handle | 60115 | 62243 |
| `maestri:portalDesign:region` | renderer->main | handle | 60114 | 62242 |
| `maestri:portalDesign:resolveScript` | renderer->main | handle | 60113 | 62241 |
| `maestri:preferences:get` | renderer->main | handle | 59850 | 62690 |
| `maestri:preferences:onChanged` | — | alias | 59852 | 63011 |
| `maestri:preferences:set` | renderer->main | handle | 59851 | 62691 |
| `maestri:preferences:subscribe` | renderer->main | on | 59853 | 60430 |
| `maestri:preferences:unsubscribe` | renderer->main | on | 59854 | 60431 |
| `maestri:prompter:cancelFileIndex` | renderer->main | handle | 60132 | 62670 |
| `maestri:prompter:deliver` | renderer->main | handle | 60129 | 62331 |
| `maestri:prompter:fileIcon` | renderer->main | handle | 60133 | 62674 |
| `maestri:prompter:fileIndex` | renderer->main | handle | 60131 | 62641 |
| `maestri:prompter:materialize` | renderer->main | handle | 60130 | 62311 |
| `maestri:prompter:mentionTargets` | renderer->main | handle | 60128 | 62589 |
| `maestri:prompter:serialize` | renderer->main | handle | 60127 | 62310 |
| `maestri:pullRequests:account` | renderer->main | handle | 60178 | 62530 |
| `maestri:pullRequests:check` | renderer->main | handle | 60183 | 62543 |
| `maestri:pullRequests:checkoutIsRemote` | renderer->main | handle | 60179 | 62529 |
| `maestri:pullRequests:closeImages` | renderer->main | handle | 60176 | 62526 |
| `maestri:pullRequests:folders:account` | renderer->main | handle | 60193 | 62570 |
| `maestri:pullRequests:folders:branches` | renderer->main | handle | 60191 | 62568 |
| `maestri:pullRequests:folders:close` | renderer->main | handle | 60202 | 62588 |
| `maestri:pullRequests:folders:diff` | renderer->main | handle | 60194 | 62571 |
| `maestri:pullRequests:folders:fileDiff` | renderer->main | handle | 60195 | 62572 |
| `maestri:pullRequests:folders:imagePrefix` | renderer->main | handle | 60198 | 62584 |
| `maestri:pullRequests:folders:imagesExist` | renderer->main | handle | 60200 | 62586 |
| `maestri:pullRequests:folders:keepImage` | renderer->main | handle | 60199 | 62585 |
| `maestri:pullRequests:folders:open` | renderer->main | handle | 60196 | 62573 |
| `maestri:pullRequests:folders:openFromTree` | renderer->main | handle | 60190 | 62564 |
| `maestri:pullRequests:folders:openOnWebsite` | renderer->main | handle | 60197 | 62574 |
| `maestri:pullRequests:folders:prepare` | renderer->main | handle | 60192 | 62569 |
| `maestri:pullRequests:folders:showImages` | renderer->main | handle | 60201 | 62587 |
| `maestri:pullRequests:forget` | renderer->main | handle | 60187 | 62547 |
| `maestri:pullRequests:getState` | renderer->main | handle | 60167 | 62521 |
| `maestri:pullRequests:handOff` | renderer->main | handle | 60189 | 62549 |
| `maestri:pullRequests:imagePrefix` | renderer->main | handle | 60172 | 62522 |
| `maestri:pullRequests:imagesDismissed` | renderer->main | handle | 60177 | 62527 |
| `maestri:pullRequests:imagesExist` | renderer->main | handle | 60174 | 62524 |
| `maestri:pullRequests:keepImage` | renderer->main | handle | 60173 | 62523 |
| `maestri:pullRequests:lookForExisting` | renderer->main | handle | 60180 | 62531 |
| `maestri:pullRequests:markSeen` | renderer->main | handle | 60184 | 62544 |
| `maestri:pullRequests:merge` | renderer->main | handle | 60186 | 62546 |
| `maestri:pullRequests:onOpenSheet` | main->renderer | emit | 60169 | 62990 |
| `maestri:pullRequests:onStateChanged` | main->renderer | emit | 60168 | 62989 |
| `maestri:pullRequests:open` | renderer->main | handle | 60181 | 62532 |
| `maestri:pullRequests:openOnWebsite` | renderer->main | handle | 60182 | 62533 |
| `maestri:pullRequests:prepare` | renderer->main | handle | 60171 | 62528 |
| `maestri:pullRequests:push` | renderer->main | handle | 60185 | 62545 |
| `maestri:pullRequests:removeMerged` | renderer->main | handle | 60188 | 62548 |
| `maestri:pullRequests:setPresented` | renderer->main | on | 60170 | 62520 |
| `maestri:pullRequests:showImages` | renderer->main | handle | 60175 | 62525 |
| `maestri:remote:beginPairingWindow` | renderer->main | handle | 60249 | 62928 |
| `maestri:remote:endPairingWindow` | renderer->main | handle | 60250 | 62939 |
| `maestri:remote:getState` | renderer->main | handle | 60247 | 62921 |
| `maestri:remote:onCameraFrame` | main->renderer | emit | 60260 | 63016 |
| `maestri:remote:onPresence` | main->renderer | emit | 60258 | 63015 |
| `maestri:remote:onStateChanged` | main->renderer | emit | 60248 | 63014 |
| `maestri:remote:partituraPreviewRequest` | main->renderer | emit | 60261 | 62954 |
| `maestri:remote:partituraPreviewResult` | renderer->main | handle | 60262 | 62950 |
| `maestri:remote:portalReloadRequest` | main->renderer | emit | 60263 | 62965 |
| `maestri:remote:portalReloadResult` | renderer->main | handle | 60264 | 62961 |
| `maestri:remote:presenceResend` | renderer->main | on | 60259 | 62960 |
| `maestri:remote:renameDevice` | renderer->main | handle | 60257 | 62949 |
| `maestri:remote:revokeDevice` | renderer->main | handle | 60255 | 62947 |
| `maestri:remote:setDeviceRole` | renderer->main | handle | 60256 | 62948 |
| `maestri:remote:setEnabled` | renderer->main | handle | 60251 | 62943 |
| `maestri:remote:setPassword` | renderer->main | handle | 60254 | 62946 |
| `maestri:remote:setPort` | renderer->main | handle | 60252 | 62944 |
| `maestri:remote:setTailnetOnly` | renderer->main | handle | 60253 | 62945 |
| `maestri:routine:create` | renderer->main | handle | 60237 | 62893 |
| `maestri:routine:delete` | renderer->main | handle | 60239 | 62901 |
| `maestri:routine:history` | renderer->main | handle | 60243 | 62914 |
| `maestri:routine:historyClear` | renderer->main | handle | 60245 | 62918 |
| `maestri:routine:historyRemove` | renderer->main | handle | 60244 | 62915 |
| `maestri:routine:list` | renderer->main | handle | 60236 | 62892 |
| `maestri:routine:onChanged` | main->renderer | emit | 60242 | 63021 |
| `maestri:routine:onHistoryChanged` | main->renderer | emit | 60246 | 63022 |
| `maestri:routine:runNow` | renderer->main | handle | 60241 | 62911 |
| `maestri:routine:setEnabled` | renderer->main | handle | 60240 | 62904 |
| `maestri:routine:update` | renderer->main | handle | 60238 | 62894 |
| `maestri:sidebarLayout:get` | renderer->main | handle | 60210 | 62811 |
| `maestri:sidebarLayout:onChanged` | main->renderer | emit | 60212 | 63010 |
| `maestri:sidebarLayout:set` | renderer->main | handle | 60211 | 62812 |
| `maestri:snapNode` | renderer->main | handle | 60124 | 62688 |
| `maestri:terminal:activity` | main->renderer | emit | 59993 | 62982 |
| `maestri:terminal:attach` | renderer->main | handle | 59988 | 61936 |
| `maestri:terminal:deliverPrompt` | renderer->main | handle | 59982 | 61875 |
| `maestri:terminal:dims` | renderer->main | handle | 59983 | 61876 |
| `maestri:terminal:discardResume` | renderer->main | handle | 59987 | 61933 |
| `maestri:terminal:focusRequested` | main->renderer | send | 60025 | 101466 |
| `maestri:terminal:getScrollback` | renderer->main | handle | 59989 | 61937 |
| `maestri:terminal:kill` | renderer->main | handle | 59985 | 61880 |
| `maestri:terminal:markSeen` | renderer->main | on | 60023 | 61941 |
| `maestri:terminal:onData` | main->renderer | emit | 59990 | 62968 |
| `maestri:terminal:onExit` | main->renderer | emit | 59991 | 62969 |
| `maestri:terminal:onGeometryPinned` | main->renderer | emit | 60026 | 63017 |
| `maestri:terminal:onRoleInstallFailures` | main->renderer | emit | 60022 | 62978 |
| `maestri:terminal:onStatus` | main->renderer | emit | 59992 | 62976 |
| `maestri:terminal:publishLiveColors` | renderer->main | handle | 60027 | 62275 |
| `maestri:terminal:resize` | renderer->main | handle | 59984 | 61877 |
| `maestri:terminal:resolvePath` | renderer->main | handle | 60095 | 62178 |
| `maestri:terminal:restart` | renderer->main | handle | 59986 | 61932 |
| `maestri:terminal:roleInstallFailures` | renderer->main | handle | 59994 | 61534 |
| `maestri:terminal:setFocused` | renderer->main | on | 60024 | 61945 |
| `maestri:terminal:spawn` | renderer->main | handle | 59980 | 61533 |
| `maestri:terminal:write` | renderer->main | on | 59981 | 61873 |
| `maestri:tidyNode` | renderer->main | handle | 60125 | 62689 |
| `maestri:updates:check` | renderer->main | handle | 59847 | 60548 |
| `maestri:updates:onProgress` | main->renderer | emit | 59848 | 63024 |
| `maestri:updates:restartAndInstall` | renderer->main | handle | 59849 | 60549 |
| `maestri:updates:state` | renderer->main | handle | 59846 | 60547 |
| `maestri:windowControls:close` | renderer->main | handle | 59834 | 60504 |
| `maestri:windowControls:minimize` | renderer->main | handle | 59832 | 60495 |
| `maestri:windowControls:onChanged` | main->renderer | send | 59835 | 102393 |
| `maestri:windowControls:state` | renderer->main | handle | 59831 | 60487 |
| `maestri:windowControls:toggleMaximize` | renderer->main | handle | 59833 | 60498 |
| `maestri:workspace:beginUndoGroup` | renderer->main | handle | 59887 | 61086 |
| `maestri:workspace:configFiles:read` | renderer->main | handle | 59890 | 61103 |
| `maestri:workspace:configFiles:remove` | renderer->main | handle | 59892 | 61105 |
| `maestri:workspace:configFiles:status` | renderer->main | handle | 59889 | 61102 |
| `maestri:workspace:configFiles:sync` | renderer->main | handle | 59893 | 61106 |
| `maestri:workspace:configFiles:write` | renderer->main | handle | 59891 | 61104 |
| `maestri:workspace:create` | renderer->main | handle | 59866 | 60572 |
| `maestri:workspace:delete` | renderer->main | handle | 59868 | 60625 |
| `maestri:workspace:duplicate` | renderer->main | handle | 59869 | 60626 |
| `maestri:workspace:endUndoGroup` | renderer->main | handle | 59888 | 61087 |
| `maestri:workspace:export` | renderer->main | handle | 59870 | 60638 |
| `maestri:workspace:getActiveId` | renderer->main | handle | 59882 | 60777 |
| `maestri:workspace:import` | renderer->main | handle | 59871 | 60661 |
| `maestri:workspace:importComplete` | renderer->main | handle | 59873 | 60683 |
| `maestri:workspace:importOpened` | renderer->main | handle | 59872 | 60682 |
| `maestri:workspace:list` | renderer->main | handle | 59865 | 60571 |
| `maestri:workspace:onChanged` | main->renderer | emit | 59879 | 62984 |
| `maestri:workspace:onDeleted` | main->renderer | emit | 59880 | 62985 |
| `maestri:workspace:onLevelsUnloaded` | main->renderer | emit | 59881 | 61792 |
| `maestri:workspace:openRequested` | — | alias | 59874 | 101512 |
| `maestri:workspace:patch` | renderer->main | handle | 59867 | 60578 |
| `maestri:workspace:redo` | renderer->main | handle | 59886 | 61095 |
| `maestri:workspace:reorderFloor` | renderer->main | handle | 59884 | 60778 |
| `maestri:workspace:reveal` | renderer->main | handle | 59876 | 60756 |
| `maestri:workspace:setFloorStatus` | renderer->main | handle | 59883 | 60776 |
| `maestri:workspace:setPreferredIde` | renderer->main | handle | 59878 | 60779 |
| `maestri:workspace:switch` | renderer->main | handle | 59877 | 60771 |
| `maestri:workspace:undo` | renderer->main | handle | 59885 | 61088 |
| `maestri:workspace:unload` | renderer->main | handle | 59875 | 60755 |

## Sem implementacao localizada

- `maestri:app:shutdown`
