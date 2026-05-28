# Graph Report - C:\Users\lucas\Documents\PROJETOS ANTIGRAVITY_2\bolao da copa\Layout Amauri\bolao-copa-2026  (2026-05-28)

## Corpus Check
- 38 files · ~160,578 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 105 nodes · 102 edges · 30 communities detected
- Extraction: 83% EXTRACTED · 17% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 12 edges
2. `recalculateScores()` - 5 edges
3. `fetchViaApi()` - 4 edges
4. `normalizeFromRenderedText()` - 4 edges
5. `fetchMatchState()` - 4 edges
6. `pollOnce()` - 4 edges
7. `updateGameResult()` - 4 edges
8. `checkInUser()` - 4 edges
9. `normalizeFromApi()` - 3 edges
10. `findPossession()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `checkCpfExists()` --calls--> `createClient()`  [INFERRED]
  C:\Users\lucas\Documents\PROJETOS ANTIGRAVITY_2\bolao da copa\Layout Amauri\bolao-copa-2026\src\app\cadastro\actions.ts → C:\Users\lucas\Documents\PROJETOS ANTIGRAVITY_2\bolao da copa\Layout Amauri\bolao-copa-2026\src\lib\supabase\server.ts
- `toggleGameEnabled()` --calls--> `createClient()`  [INFERRED]
  C:\Users\lucas\Documents\PROJETOS ANTIGRAVITY_2\bolao da copa\Layout Amauri\bolao-copa-2026\src\app\admin\actions.ts → C:\Users\lucas\Documents\PROJETOS ANTIGRAVITY_2\bolao da copa\Layout Amauri\bolao-copa-2026\src\lib\supabase\server.ts
- `recalculateScores()` --calls--> `handleRecalc()`  [INFERRED]
  C:\Users\lucas\Documents\PROJETOS ANTIGRAVITY_2\bolao da copa\Layout Amauri\bolao-copa-2026\src\app\admin\actions.ts → C:\Users\lucas\Documents\PROJETOS ANTIGRAVITY_2\bolao da copa\Layout Amauri\bolao-copa-2026\src\app\admin\AdminTabs.tsx
- `AdminPage()` --calls--> `createClient()`  [INFERRED]
  C:\Users\lucas\Documents\PROJETOS ANTIGRAVITY_2\bolao da copa\Layout Amauri\bolao-copa-2026\src\app\admin\page.tsx → C:\Users\lucas\Documents\PROJETOS ANTIGRAVITY_2\bolao da copa\Layout Amauri\bolao-copa-2026\src\lib\supabase\server.ts
- `registerUser()` --calls--> `createClient()`  [INFERRED]
  C:\Users\lucas\Documents\PROJETOS ANTIGRAVITY_2\bolao da copa\Layout Amauri\bolao-copa-2026\src\app\cadastro\actions.ts → C:\Users\lucas\Documents\PROJETOS ANTIGRAVITY_2\bolao da copa\Layout Amauri\bolao-copa-2026\src\lib\supabase\server.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.15
Nodes (12): checkInUser(), recalculateScores(), stageFromFD(), syncGamesFromAPI(), toggleGameEnabled(), updateGameResult(), handleCheckIn(), handleRecalc() (+4 more)

### Community 1 - "Community 1"
Cohesion: 0.27
Nodes (12): fetchJson(), fetchMatchState(), fetchViaApi(), fetchViaBrowser(), findPossession(), inferStatus(), main(), normalizeFromApi() (+4 more)

### Community 2 - "Community 2"
Cohesion: 0.22
Nodes (5): checkCpfExists(), registerUser(), calcAge(), handleRegister(), validateRegister()

### Community 3 - "Community 3"
Cohesion: 0.2
Nodes (5): submitPrediction(), submitTournamentPredictions(), handleSubmit(), validate(), handleSubmit()

### Community 4 - "Community 4"
Cohesion: 0.33
Nodes (0): 

### Community 5 - "Community 5"
Cohesion: 0.5
Nodes (0): 

### Community 6 - "Community 6"
Cohesion: 0.5
Nodes (0): 

### Community 7 - "Community 7"
Cohesion: 0.5
Nodes (0): 

### Community 8 - "Community 8"
Cohesion: 1.0
Nodes (0): 

### Community 9 - "Community 9"
Cohesion: 1.0
Nodes (0): 

### Community 10 - "Community 10"
Cohesion: 1.0
Nodes (0): 

### Community 11 - "Community 11"
Cohesion: 1.0
Nodes (0): 

### Community 12 - "Community 12"
Cohesion: 1.0
Nodes (0): 

### Community 13 - "Community 13"
Cohesion: 1.0
Nodes (0): 

### Community 14 - "Community 14"
Cohesion: 1.0
Nodes (0): 

### Community 15 - "Community 15"
Cohesion: 1.0
Nodes (0): 

### Community 16 - "Community 16"
Cohesion: 1.0
Nodes (0): 

### Community 17 - "Community 17"
Cohesion: 1.0
Nodes (0): 

### Community 18 - "Community 18"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "Community 19"
Cohesion: 1.0
Nodes (0): 

### Community 20 - "Community 20"
Cohesion: 1.0
Nodes (0): 

### Community 21 - "Community 21"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "Community 22"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "Community 23"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "Community 24"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "Community 25"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Community 26"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Community 28"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Community 8`** (2 nodes): `page.tsx`, `HomePage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 9`** (2 nodes): `GameRow.tsx`, `GameRow()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 10`** (2 nodes): `SyncButton.tsx`, `SyncButton()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 11`** (2 nodes): `CountdownTimer.tsx`, `pad()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (2 nodes): `page.tsx`, `PalpitesPreviewPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (2 nodes): `RankingTable.tsx`, `maskName()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (2 nodes): `AdminButton()`, `AdminButton.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (2 nodes): `Badge()`, `Badge.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (2 nodes): `Card.tsx`, `Card()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (2 nodes): `client.ts`, `createClient()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (1 nodes): `eslint.config.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (1 nodes): `next.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (1 nodes): `postcss.config.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (1 nodes): `layout.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (1 nodes): `GameCard.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (1 nodes): `VideoBackground.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (1 nodes): `Button.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (1 nodes): `Input.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (1 nodes): `types.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createClient()` connect `Community 0` to `Community 2`, `Community 3`?**
  _High betweenness centrality (0.115) - this node is a cross-community bridge._
- **Why does `registerUser()` connect `Community 2` to `Community 0`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Are the 11 inferred relationships involving `createClient()` (e.g. with `syncGamesFromAPI()` and `toggleGameEnabled()`) actually correct?**
  _`createClient()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `recalculateScores()` (e.g. with `createClient()` and `handleRecalc()`) actually correct?**
  _`recalculateScores()` has 2 INFERRED edges - model-reasoned connections that need verification._