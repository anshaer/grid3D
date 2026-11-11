# AI維護交接：3D格子固定角色／場景

更新：2026-11-11｜主儲存庫grid3D｜桌面v1.6.1

## 範圍
網站 https://anshaer.github.io/grid3D/ ，程式庫 https://github.com/anshaer/grid3D 。voxel-builder.html是原固定模型工具的獨立單檔，標題GLB方塊製作器。這套是固定方格模型與逐幀動畫工具，不是FaceLandmarker動捕角色製作器。不要套用另一套schema或聲稱JSON互通。

## 結構與座標
單檔HTML，包含內嵌Three.js／控制器等第三方程式與最後一段應用script。修改時優先定位最後的應用程式，避免誤改壓縮供應商程式。主要狀態N、cells Map、history、scene、camera、renderer、controls、renderGroup、gridGroup、frames等。key為逗號座標x,y,z，toWorld([x,y,z])=[x,z,-y]。使用者座標1～N，X右、Y後、Z上；尺寸32／64／128／256／512。顏色sRGB轉線性處理與匯出軸映射不可任意移除。

## JSON
單模型格式voxel-editor-v1，範例：
```json
{"format":"voxel-editor-v1","axes":"X-right_Y-back_Z-up","name":"BlockModel","size":128,"origin":1,"voxels":[{"position":[64,64,64],"color":"#98d9c5","opacity":1}]}
```
exportAxes可保存輸出軸選擇，值格式請看currentAxes／axisMatrix；不要猜。parseJSON驗證座標整數1～N、#rrggbb顏色、opacity0～1、最多100000格。單模型檔20MB上限。匯入預設opacity1，重複座標由後值覆寫。
動畫專案voxel-animation-v1/v2；同尺寸時v2採基底與增刪差分，混尺寸退回v1。請使用animationProject／decodeProjectFrames／loadProject維護，不自行硬寫差分。動畫目前最多1000幀，單幀16～60000ms，FPS1～60；檔名中的600幀字樣不是現在驗證上限。變更上限必須同查所有匯入路徑及記憶體行為。

## 功能保持
建模新增／套用／刪除／復原；圖片參考；網格與三軸；相機／外觀／按鍵；模型JSON匯入匯出；新增／複製／刪除／排序幀；批次JSON、動畫專案匯入匯出；循環／來回；逐幀／共同鏡頭；GLB與圖片輸出。JSON載入有進度、驗證及取消取代確認；大檔處理會yield，不可拿掉導致畫面假死。
從預設單格首次批次匯入可取代起始幀，既有使用者資料應保留確認流程。注意快取invalidateFrames／storeFrame／installFrame／drawFrames與資源dispose；匯出時不要把輔助格線、選取框或參考圖片意外當模型。

## 驗證要求
檢查所有script語法；瀏覽器確認初始渲染、加刪格／透明度、JSON往返、非法座標與大檔拒絕、圖片參考、逐幀播放與排序／循環、共同及逐幀鏡頭、GLB／圖片輸出。大量動畫需實測記憶體，不能只增加允許幀數就聲稱流暢。目前合併只調整入口、桌面打包與文件，未改固定模型工具行為；不宣稱此次已重跑全部建模與動畫測試。

## 與另一套工具及桌面關係
動捕角色讀AI_MOTION_CHARACTER.md。固定模型JSON不能直接讓動捕桌面應用作角色；如需轉換，要另設計部位、五官與支點映射，先定義轉換規格。桌面下載入口以README的grid3D Actions工作流程為準；舊成品ID及SHA-256不能當成新儲存庫的成品，不捏造簽章或平台測試結果。保留附件中的第三方授權註記，修改後仍交付單檔HTML。

## 單一儲存庫與桌面應用邊界

| 位置 | 用途 |
| --- | --- |
| https://github.com/anshaer/grid3D | 唯一主儲存庫 |
| https://anshaer.github.io/grid3D/ | 網站首頁 |
| voxel-builder.html | 本工具，固定模型／逐幀動畫 |
| character-builder.html、character-player.html、motion-source/ | 另一套動捕角色工具，詳AI_MOTION_CHARACTER.md |
| desktop/ | 動捕桌面應用v1.6.1，不是固定場景桌面版 |
| .github/workflows/build-app.yml | 根目錄三平台桌面建置 |
| EX/ | 使用者範例JSON，保留原檔，不刪除或覆蓋 |

固定模型工具保持獨立，不能因整合儲存庫就把voxel-editor-v1直接塞進動捕播放器。若修改網站共用入口，要保留兩套工具的格式提示及連結。桌面v1.6.1的六部位動補勾選只屬動捕工具，不適用固定場景，也不代表網站製作頁已同步這項新控制。

## EX與打包約束

- 根目錄EX不進桌面成品，也不放入本次交付ZIP；使用者上傳合併檔案時保留現有EX。GitHub內建Code → Download ZIP仍會包括儲存庫本來的EX。
- desktop/build-folder.cjs使用APP_FILES明確白名單：index.html、main.cjs、preload.cjs、三個cube圖示，另產生執行用package.json。不可改成複製整個根目錄或desktop/。
- voxel-builder.html、EX、examples、motion-source、網站、MD、測試及開發依賴都不進應用payload；官方Electron所需執行環境與授權檔仍保留。
- Actions只上傳desktop/dist/VoxelCharacter或Mac內層ZIP。修改desktop/**及工作流程才自動建置；更新EX或固定模型網站不觸發。手動Run workflow仍可執行。
- 打包修改先執行cd desktop && npm test。不要覆蓋desktop/index.html而丟失JSON載入、透明視窗、背景執行及六部位動捕勾選。
- 實際成品必須等 https://github.com/anshaer/grid3D/actions/workflows/build-app.yml 成功後才有。不得憑文件變更宣稱三平台成品或真人追蹤已測試。
