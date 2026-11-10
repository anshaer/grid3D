# 合併到 anshaer/grid3D

1. 解壓交付ZIP，將裡面的內容合併到grid3D儲存庫根目錄。不要把ZIP外層再建立成第二層子目錄。
2. 保留現有EX/資料夾；本交付ZIP完全不含EX，不會覆蓋範例JSON。
3. 確認 `.github/workflows/build-app.yml` 在儲存庫根目錄，應用檔案位於desktop/。
4. 提交到main後，Actions會自動建置三平台。也可在Build desktop apps按Run workflow。
5. 等最新執行成功後，在Artifacts下載原本的三種名稱。網站按鈕已改指向grid3D的工作流程頁。
6. 舊儲存庫的歷史Actions成品不會被搬移；舊SHA-256不適用新包。確定新儲存庫成功後，再自行決定舊儲存庫的保留方式。

網站仍用 https://anshaer.github.io/grid3D/ 。不需要修改GitHub Pages的根目錄設定。

應用成品只包含官方Electron執行環境與desktop內白名單檔案。只修改EX、網站或一般MD不觸發桌面建置。

注意：GitHub的Code → Download ZIP屬於GitHub提供的儲存庫原始碼下載，因此仍會包含儲存庫本來就有的EX。排除EX的保證適用本次交付ZIP與Actions桌面應用成品；不會把範例從儲存庫刪掉。
