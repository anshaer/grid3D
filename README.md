# 3D格子製作工具

文件更新：2026-11-11｜桌面應用：v1.6.1

以方格建立動捕角色、固定角色與場景。兩套工具在同一網站提供獨立入口。

- 網站：https://anshaer.github.io/grid3D/
- 原始碼：https://github.com/anshaer/grid3D
- 桌面應用建置：https://github.com/anshaer/grid3D/actions/workflows/build-app.yml

## 工具入口

| 工具 | 網頁 | 用途 |
| --- | --- | --- |
| 3D格子動捕角色 | [開啟製作頁](https://anshaer.github.io/grid3D/character-builder.html) | Q版角色、獨立五官、頭部與全身動捕、手肘／膝蓋彎折 |
| 3D格子固定角色／場景 | [開啟製作頁](https://anshaer.github.io/grid3D/voxel-builder.html) | 方塊建模、固定角色、場景、圖片參考及逐幀動畫 |
| 角色應用範例 | [開啟角色頁](https://anshaer.github.io/grid3D/character-player.html) | 基礎角色播放與輸入設定；讀取自製JSON請用桌面應用 |

下載整包後可直接開啟HTML；攝影機建議使用上列HTTPS網址或localhost。首次動捕需要連線下載辨識程式及模型。

## 3D格子動捕角色

1. 開啟 `character-builder.html`，使用預設128格圓頭Q版素體，或在製作頁載入角色JSON。
2. 編輯頭、左手、左腳、右手、右腳。左右以角色本身為準；手／腳含整段手臂／腿。軀幹有獨立旋轉支點。
3. 在「基準點／彎折點」調整頭、軀幹、四肢支點，以及手肘、膝蓋位置；下段為小臂／小腿，含手掌／腳掌。用四肢面板預覽彎曲，不用重做JSON。
4. 編輯左右眼、嘴型、左右眉的獨立狀態。同五官不同狀態可覆蓋，跨五官會阻擋並顯示不可覆蓋。
5. 在「測試」選手動、本機鏡頭或VMC。鏡頭可選「面部＋頭部」或「全身＋面部＋頭部」，啟動後觀察骨架與各肢狀態。校正按下3秒後取樣。
6. 在「輸出」設定檔名、頁籤名、頁籤文字動畫，再輸出HTML／GLB／JSON或三格式ZIP。

| 偵測 | 內容 |
| --- | --- |
| 左眼／右眼 | 各自睜眼、微睜眼、閉眼 |
| 嘴型 | 張嘴、微張、閉嘴嘴角上、閉嘴嘴角下 |
| 左眉／右眉 | 各自抬高、復位 |
| 頭部 | 前後仰、左右轉、左右歪 |
| 全身鏡頭 | 軀幹、四肢上段、手肘／膝蓋以下的下段 |

全身模式仍保留面部與頭部偵測；全身入鏡時臉較小，細節精度可能降低。四肢獨立判斷，不要求雙肩雙髖全部入鏡；仍需看見欲追蹤的關節。沒有手指、脊椎彎折、腳掌局部追蹤、地面位移或腳底鎖定。VMC目前只接面部／頭部，尚未接身體骨骼。

製作頁有模型格線、XYZ單層／全層格線、顏色與透明度、三軸輔助線、其他格淡化、參考圖尺寸與透明度。選格XYZ及顏色在預覽下方工具列；QA／WS／ED調整三軸，輸入文字時不應觸發選格快捷鍵。

尺寸支援64／128／256／512；基礎素體固定128。支點與彎折資料保存於JSON。彎折採平面切分上下段，未做蒙皮或補縫，大角度可能露出切口或穿插。

### 匯出格式

- **JSON**：可繼續編輯的動捕角色專案，含方格、表情、支點、彎折與設定。範例為 `examples/base-character-128.json`。
- **HTML**：獨立角色頁，含設定與鏡頭偵測。左鍵點角色開設定、右鍵旋轉、中鍵或滾輪縮放；透明背景只留角色。
- **GLB**：當下造型及姿勢的定型幾何、頂點色；不含面捕程式、VRM或蒙皮骨架。

頁籤動畫是 `document.title` 文字逐格切換，並非影片圖示。格式可用 `{title}`／`{frame}`；每行一格，最多32格，每格120字，間隔100～5000ms。favicon為🏃‍♂️，不隨文字動畫改變。瀏覽器背景頁籤可能降速。

## 3D格子固定角色／場景

使用附件原版工具，保留其建模、插入圖片、動畫、鏡頭、外觀、按鍵、檔案、GLB輸出及圖片輸出頁籤。

1. 設定32／64／128／256／512網格、XYZ位置、顏色及透明度，新增／套用、刪除或復原方塊。
2. 使用插入圖片與網格作為建模參考；調整外觀、鏡頭與按鍵。
3. 在檔案頁匯入／匯出模型JSON；動畫頁可新增、複製、排序幀或批次匯入JSON，設定幀時間、循環／來回及鏡頭。
4. 匯出GLB或圖片；要保留可編輯動畫，另存動畫專案JSON。

這套沒有鏡頭面部／人體追蹤。其模型JSON為 `voxel-editor-v1`，動畫專案為 `voxel-animation-v1/v2`；與動捕角色的 `ansha-chibi-studio-v1` 不互通，請在原工具載入。單模型匯入最多10萬方塊、20MB，座標為1～N。動畫上限以工具當前驗證為準（目前程式1000幀），效能取決於方塊數及裝置，並非預設可順暢播放的保證。

## 桌面免安裝下載

[前往 grid3D 桌面應用 Actions](https://github.com/anshaer/grid3D/actions/workflows/build-app.yml)，開啟最新成功的執行紀錄，在 **Artifacts** 下載對應平台：

| 平台 | 下載包名稱 |
| --- | --- |
| Windows | `VoxelCharacter-Windows-folder` |
| Mac M系列 | `VoxelCharacter-macOS-AppleSilicon` |
| Mac Intel | `VoxelCharacter-macOS-Intel` |

第一次合併後，需先執行 **Build desktop apps** 工作流程並成功完成，才會出現此儲存庫的下載包。舊儲存庫的 Actions 成品不會隨原始碼搬移。下載可能需要登入 GitHub；成品受保存期限限制。新包的雜湊值以該次實際建置產物為準，不沿用舊包的SHA-256。

Windows解壓縮後執行 `electron.exe` 並保留整個資料夾；Mac解開下載內的ZIP後執行 `Electron.app`。Mac M1／M2等M系列選Apple Silicon，Intel處理器選Intel。

桌面 v1.6.1 保留透明視窗、JSON載入、防背景降速，以及六個「動補應用範圍」勾選：頭部、軀幹、左手、右手、左腳、右腳。只有勾選的部位套用動捕；取消勾選維持當下世界姿勢及彎折，臉部表情持續。詳細設定與Windows單檔更新見 [desktop/README.md](desktop/README.md)。

## 同一儲存庫的網站與桌面應用

- 主儲存庫：https://github.com/anshaer/grid3D
- 網站仍在根目錄，GitHub Pages網址不變。
- 桌面應用原始碼在 `desktop/`；建置工作流程在根目錄 `.github/workflows/build-app.yml`。
- `EX/` 是自行管理的範例JSON；保留在儲存庫，**不進入桌面應用成品**。
- 打包採指定檔案清單，只放 `desktop/index.html`、`main.cjs`、`preload.cjs`、三個cube圖示及產生的執行用package.json。
- `README`、AI用MD、網站頁面、`EX/`、`examples/`、`motion-source/`、測試程式、工作流程與開發用node_modules不會被加入應用頁面資料夾。
- 修改 `desktop/**` 或打包工作流程才自動建置；只更新網站或 `EX/**` 不觸發。可隨時從Actions手動Run workflow。
- 網站及桌面頁仍是各自的成品入口；合併儲存庫不會自動把製作頁覆蓋成桌面頁。

建置前在 `desktop/` 執行 `npm test`，會用模擬Windows／Mac執行環境檢查檔案白名單、EX排除、官方Windows執行檔位元組及Mac符號連結保留。

## 給AI與維護者

- [動捕角色 AI 用 MD](AI_MOTION_CHARACTER.md)
- [固定角色／場景 AI 用 MD](AI_STATIC_SCENE.md)

`motion-source/` 是角色製作器的拆分原始碼，可重建單檔；`voxel-builder.html` 為附件保留原版。兩者不要混用JSON schema。未提供附件內嵌第三方程式的額外授權；再散布時保留原檔授權註記並確認上游條款。

本次整合驗證入口、檔案連結與HTML腳本語法；沒有重新實測真人鏡頭、桌面各平台或FPS。既有模擬測試不等於實機追蹤驗證。


## 網頁與桌面功能版本

| 入口 | 目前姿勢控制 |
| --- | --- |
| 網頁製作頁／角色頁 | v19：偵測不到維持姿勢、3秒後鎖定軀幹／四肢 |
| desktop桌面應用 | v1.6.1：以六部位「動補應用範圍」勾選取代舊鎖定控制 |

六部位勾選目前已實作在桌面頁，不代表網站製作頁也已同步。頭部勾選只控制頭部旋轉，眼口眉仍可面捕。未勾選的四肢保留上／下段世界姿勢，不隨動捕軀幹漂移。勾選狀態存入JSON；當次追蹤快照不存入JSON，重新載入從檔內手動姿勢開始。

畫面顯示辨識結果資訊，不顯示真人鏡頭影像；隱藏video仍作為辨識輸入。沒有完整腿部資料時，腿部保留上一有效姿勢，沒有歷史則維持手動／站姿，不跟軀幹飄移。

## 更新與交付

用交付ZIP覆蓋或合併儲存庫檔案即可，勿刪除EX；詳見[MIGRATION.md](MIGRATION.md)。本次交付ZIP不含EX，Actions應用成品也不含EX。GitHub內建Code → Download ZIP下載的是整個儲存庫，因此仍會含儲存庫中的EX。

上傳原始碼後，請等待grid3D的Actions成功，才有新的Windows／Mac下載包。舊儲存庫的成品與SHA-256不會自動移轉。原始碼ZIP不等於已編譯的EXE／.app；未完成Actions或實機檢查時，不應標示已建置／已實測。

© 2026–2030 anshaer.com
