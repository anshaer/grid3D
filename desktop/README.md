# grid3D 桌面角色應用 v1.6.1

主儲存庫：https://github.com/anshaer/grid3D  
網站：https://anshaer.github.io/grid3D/  
下載／建置：https://github.com/anshaer/grid3D/actions/workflows/build-app.yml

## 使用

開啟應用，左鍵點角色進入設定，在「畫面設定」開啟角色JSON。輸入可選手動、攝影機、VMC；攝影機首次使用需連線下載辨識模型。透明視窗、防背景降速與圖示沿用原應用。

「動補應用範圍」提供頭部、軀幹、左右手及左右腳勾選。勾選才套用動捕，取消勾選維持當下世界姿勢及彎折；頭部勾選控制轉頭，眼口眉表情持續追蹤。`settings.captureParts`保存勾選；姿勢快照是本次執行階段資料。舊JSON缺設定時預設全部勾選。

Windows解開整包後執行electron.exe，不要只移動EXE。已經使用資料夾版者，可完全關閉程式後，以本目錄index.html覆蓋應用的resources/app/index.html。Mac重新建置並下載整包，不直接修改簽章後的.app。

## 自動建置

工作流程放在儲存庫根目錄 `.github/workflows/build-app.yml`，不放在desktop內。Actions只在desktop內容或該工作流程更新時自動執行，也保留Run workflow手動按鈕。輸出名稱維持：

- VoxelCharacter-Windows-folder
- VoxelCharacter-macOS-AppleSilicon
- VoxelCharacter-macOS-Intel

所有run步驟在desktop/執行；上傳成品路徑明確指定desktop/dist/VoxelCharacter或Mac內層ZIP。

## 只打包應用需要的檔案

`build-folder.cjs`複製官方Electron執行環境，再用白名單加入以下檔案：

- main.cjs、preload.cjs、index.html
- assets/cube.png、assets/cube.ico、assets/cube.svg
- 由本目錄package.json產生的精簡執行用package.json

不複製整個儲存庫，也不複製整個desktop/。根目錄EX/、examples/、網站、MD、測試、工作流程與開發依賴不會混入應用資料。每次建置先清掉舊app payload，再重建白名單並驗證實際檔案；出現額外檔案會讓建置失敗。官方Windows EXE保持原位元組，Mac執行環境保留符號連結並沿用本地簽章流程。

## 本機檢查

在此目錄執行：

```sh
npm test
npm install
npm run dist
```

npm test不需安裝Electron；它使用臨時執行環境，驗證Windows／Mac檔案白名單、根目錄與desktop內EX排除、重建清除舊檔、執行檔位元組及Mac符號連結。

本次合併未改原生視窗或辨識引擎；打包排除測試及既有動補應用範圍模擬測試已通過。實際三平台成品仍需在GitHub Actions完成建置後下載確認。
