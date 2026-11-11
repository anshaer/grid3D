# AI維護交接：3D格子動捕角色

更新：2026-11-11｜桌面v1.6.1｜網頁製作器／角色頁v19

## 任務邊界
網站根址 https://anshaer.github.io/grid3D/ ，程式庫 https://github.com/anshaer/grid3D 。本文件描述 character-builder.html／character-player.html、motion-source及desktop桌面應用；固定模型工具請讀AI_STATIC_SCENE.md。不要把兩種JSON互轉當成既有功能。使用者偏好單檔HTML、透明角色頁、可編輯JSON、免安裝資料夾應用。沒有新需求不要重做角色或改變快捷鍵。

## 原始碼與重建
motion-source/app.js為UI、編輯、鏡頭、VMC與匯出；core.js為schema、表情、姿勢及GLB／ZIP；voxel.js為編解碼與表面合併；gpu.js為渲染；template.html＋style.css為版面。
執行 `python3 motion-source/assemble_chibi.py`，輸出在motion-source/Chibi_Studio_128.html與Chibi_Character_128.html，再分別複製到根目錄character-builder.html與character-player.html。不要只改生成檔而漏改原始碼。build_blank_reference.py與build_exports.cjs為原專案工具，執行前確認相依與其預期檔案，不必為一般UI調整重建範例。

## 格式與座標
格式ansha-chibi-studio-v1，version10。座標1～N，X左右、Y後、Z上，左右以角色自身為準。key=(z-1)*N*N+(y-1)*N+x-1。色盤索引RLE為[key,length,paletteIndex]，不可跨X列；表情patch的-1表示刪除。請以core.js實際序列化為準，勿自行猜欄位。
五個編輯部位head／leftHand／leftFoot／rightHand／rightFoot；手腳各含整肢。軀幹獨立存在。預設128格無髮衣Q素體；尺寸64／128／256／512，載入基礎模型回128。

## 支點與變換
core.initRig補入torso.pivot／rotation與四肢bend={enabled,pivot,rotation}，兼容舊JSON。頭／軀幹／四肢支點可改；手肘／膝蓋彎折支點可改。下段依dot(cellCenter-bendPivot,bendPivot-partPivot)>=0切分，兩支點不能重合。順序軀幹→四肢→下段；頭部跟軀幹，動捕時抵銷軀幹重複旋轉。不要把動捕暫時偏移寫回手動角度。尚無蒙皮、切口封合、逐格下段歸屬與脊椎彎折。

## 面部與編輯規則
左右眼各open／half／closed；嘴open／slight／smile／frown；左右眉各normal／raised，共144組合。實際patch鍵見core.js。跨五官的所有狀態占格合併做ownership防衝突，同組狀態可覆蓋。所有新增、塗色、刪除與顏色即時套用路徑都要防衝突，失敗不可改資料／色盤。隱藏其他五官只作用製作預覽，不刪JSON。
選格XYZ／顏色置於畫面下方dock。QA／WS／ED為三軸選格，文字輸入時不搶按鍵。側欄獨立捲動。格線有僅模型及XYZ各自單層／全層、色彩與透明度，輔助軸不畫中心圓點。參考圖片保存在JSON，HTML角色及GLB不輸出參考圖。

## 追蹤現況
settings.captureMode為face／full；鏡頭全身使用MediaPipe Tasks Vision0.10.18 FaceLandmarker與PoseLandmarker Lite CPU，同一攝影機供面部與身體。worldLandmarks優先，poseWorldLandmarks及影像landmarks為退路。各肢獨立求解，visibility>=0.3，不以presence=0封鎖；不要求雙肩雙髖同時有效，腕／踝遮住仍可處理上段。
軀幹可用肩髖、僅肩近似或上一基準。平滑0.55舊＋0.45新；面部間隔33ms、身體66ms為上限節流，非實測FPS。四肢800ms、軀幹1200ms、面部1600ms各自判斷有效性；軀幹／四肢依自動維持與應用範圍設定保留姿勢，不能一律復位。可見UI僅顯示辨識資訊，不顯示真人原始影像或綠骨架；video在畫面外持續供模型取樣。網頁停止追蹤會清除暫態保持；桌面未勾選部位有獨立captureHolds，重啟攝影機時不得因clearBody而丟失。切回手動可編輯手動姿勢。3秒校正，不抹除肘膝實際彎曲。VMC仍只有面部／頭部，無全身VMC映射。無手指、腳掌局部、地面位移、腳底鎖定。

## 輸出與桌面
JSON保留完整編輯資料，HTML保留追蹤及設定，GLB只烘焙當前幾何／姿勢。輸出頁籤動畫設定在export的tabTitle／filename／animateTitle／titleFormat／titleFrames／titleInterval，document.title文字逐格，固定emoji favicon，並非影片。保留檔名清理與字元上限。
桌面來源在本儲存庫desktop/，勿把網站首頁當桌面index.html。Windows保留官方Electron執行檔，外置resources/app/index.html。Mac複製framework須保留相對symlink（dereference:false,verbatimSymlinks:true），更新Info.plist後簽署並用ditto封裝；不要解參照symlink，曾造成unsealed contents錯誤。現行桌面與製作器都已加入彎折／全身，具體打包版本以desktop/package.json為準。

## 驗證
語法檢查、JSON往返、跨五官衝突、支點／彎折儲存、全身與面部同時輸入、髖部不可見手臂仍有效、末端遮擋上段有效、鏡像與逾時不改手動姿勢。test_runtime.cjs依賴原測試環境DOM／canvas，先檢查相依；無環境不能寫已通過。需真人鏡頭及桌面實機另驗證，不虛報FPS。

## 累計角色生成算法修正（128格四角色）

這些是**JSON模型生成算法**的修正，不是製作器／EXE自動修復功能；舊JSON不會自行變好，必須以新算法重新生成或編輯。先前四角色生成包可另附 `generation/` 可重現程式；該生成包不屬於此儲存庫的必要檔案，不可假設這裡已有generation目錄。原網站製作器仍只負責讀寫／預覽／追蹤。

### 生成順序與資料不變量

1. 建立實心頭、軀幹、四肢及衣服幾何，保留部位歸屬。
2. 補上腰胯、衣片、袖口等連接結構，再建立頭髮、鞋面與鞋底。
3. 裝飾先暫存為XZ遮罩，所有衣服主體完成後，才投影到同一部位表面。
4. 以實心遮罩檢查連接與輪廓；之後才去除內部方格、RLE編碼及core.validate。
5. 生成144組五官狀態與正／側／背預覽。正面看不到的破洞不能只靠正面驗收。

座標為X左右、Y向後、Z向上。陣列索引為[z,y,x]，模型中一格座標1～N與索引0～N-1須分清。幾何判斷以格子中心x+.5、y+.5、z+.5取樣。

### 頭髮：曲面、加厚、側髮方向

- 頭型中心[64,62,101]、半徑[25,24,25]，先計算橢球距離 `rho=sqrt((dx/25)^2+(dy/24)^2+(dz/25)^2)`。頭髮包覆區以 `rho<=1+offset/25` 生成，offset在1～2格之間隨方位變化；這是近似外擴，非精確橢球等距面。128格有量化誤差。
- 相鄰髮束採不同幾何厚度形成起伏，不能只在頭表面換深淺顏色。
- 瀏海用沿橢球曲率的髮片，前表面深度依x、z求得，尖端寬度漸縮，長短交錯。禁止把固定Y直棒排成梳子，也不要以水平色帶代替髮流。
- 後髮需要連續包覆側後頭，長髮髮幕與髮帽在體積上連接，再對下緣做錯落收尾。
- 奶油角色側髮舊路徑曾由外側反折至下巴前方，形成獠牙。改成三次Bezier，四控制點為 `[64+s*22,65,111]`、`[64+s*27,64,103]`、`[64+s*29,61,88]`、`[64+s*26,65,81]`，s為左右±1。採24個取樣點，相鄰點用漸細膠囊連接，半徑 `3*(1-t)^.7+.55`；末端停留輪廓外側，不反折進臉內。不要把左右側髮同時朝中心彎。
- 髮辮、長髮、丸子及飾品有自己的厚度，不受髮殼1～2格限制；仍需檢查遮臉、穿肩和頭部轉動。

### 鞋子：薄平底與相同輪廓

舊鞋面／鞋底分別使用橢球，造成底部凸點與鞋底擴大一圈。改為共用同一個水平鞋型遮罩，鞋底沿Z直立擠出兩層（索引z=2、3），鞋面從z=4開始；禁止z<2出現任何鞋子或裝飾格。底部各XY柱最低層完全一致。

鞋底與鞋面接縫的XY輪廓必須相同；鞋面往上才逐步收窄成靴筒。裝飾不得改動最低兩層。抽殼後有些橫截面只保留邊框，驗證時應填回封閉橫截面內部後再比較，不能把內部去除誤判成鞋底外擴。

### 衣服／鞋帶裝飾：依支撐面投影

舊方法把線、鈕扣與圖案畫在固定Y，身體曲面與褲腿位置卻不同，導致懸空。新方法暫存裝飾XZ遮罩及色盤索引，對目標部位每個(x,z)找 `min{y | solid[z,y,x]>0}`，只把該表面格改色。該柱沒有幾何支撐則略過，不得在空中新增格子。

此版細裝飾是表面色塊，非凸出的刺繡或扣件。若未來需要立體扣件，必須從支撐面向外擠出並保留接觸格；不能恢復固定Y浮空畫法。獨立尾巴、髮飾、翅膀屬造型幾何，不能誤當紋路壓扁。背面花紋應由最大Y求背表面，不能直接沿用最小Y；目前四角色裝飾採前表面投影。

### 褲胯與腿：不能只讓圓端相切

彩虹角色舊軀幹在z約52收尖，褲腿頂端也收尖；兩者投影接近，實際卻形成三角破洞。新增褲胯橢球，中心[64,64,52]、半徑[13,8.5,7]，配褲子顏色。左右腿各由[64+s*8,64,53]連至[64+s*8,64,44]、半徑5.1，讓大腿根部埋入褲胯。

褲胯歸軀幹、腿歸左右腳部位，不能為了補洞把腿併入軀幹。以實心遮罩檢查接點有體積重疊，不應只靠輪廓相切或一格角接觸。這只保證中立姿勢連接；剛性分段大角度旋轉仍可能露切口，尚未有蒙皮補縫。

### 白外套：前開襟不等於背面也開洞

薄荷角色只有左右衣片，背面露出黑色內搭。新增獨立白色背片，範圍約x44～84、y69～78、z49～76，左右邊界依高度略收窄，下緣圓角。背片須與兩側衣片在體積上相接，覆蓋內搭背面；前開襟維持開口。彩虹長外套背片同理，下緣延伸到z19。

背片必須在去除內部格子之前加入。不可把白色背片當成前表面花紋投影，不可因「刪除內部」而漏掉真正外側背面。驗證應從最大Y確認中央白色存在，而不是只確認兩側白袖子。

### 上衣與裙腰：共享過渡輪廓

藍色角色舊上衣橢球在下端變窄，直接接較寬裙子，產生台階。改在z59～66建立完整腰部過渡體積，用三次Hermite曲線混合半徑：裙側rx14、ry14/1.25、斜率-.58與-.58/1.25；上衣側rx13、ry8.5、斜率0。以7格高的t範圍計算，斜率乘區間長度7。新增形體須同時和裙子、上衣重疊。

接縫色帶只改既有外表面，不另外套一個較大腰環。保留上衣／裙子不同材質顏色，但側面半徑不能突變。實際JSON中z57～66的寬度已檢查，相鄰切片變化不超過4格；此閾值只適用本角色，不可當所有角色通用標準。

### 回歸驗證與限制

- 既有core.validate、144種五官組合、四肢上下段均非空。
- 改服飾／連接時，左右眼嘴眉patch應逐項保持不變。
- 鞋底最低兩層與前版逐格比對；不以鞋帶修改為理由破壞平底。
- 除奶油角色側髮修正外，其餘三位頭部方格應逐格保持不變。
- 彩虹褲胯z47～57中央無空層；中立姿勢檢查腿根與褲胯接觸。薄荷背片在z53／60／67／73中央後側應有白格。
- 檢查正面、正側面、背面，奶油髮束另外檢查斜俯視，必要時在實際製作頁轉動確認。
- 這些驗證不等於真人鏡頭、所有極端姿勢或EXE平台已測試；不要虛報。

### 四角色包內程式

`generation/Cute_Four_128/build.py`為累計生成算法，`verify.cjs`為既有核心格式／表情／分段驗證。依賴Python＋NumPy及Node.js；渲染預覽另需Pillow。只在取得該外部生成包、確認相應檔案存在後，進入 `generation/` 執行：

```bash
python3 Cute_Four_128/build.py
node Cute_Four_128/verify.cjs
python3 Cute_Four_128/render_preview.py
python3 Cute_Four_128/render_clothes_views.py
```

輸出仍是128格可編輯JSON，沒有改schema或要求使用者換EXE。原圖背面資訊不足處仍為Q版推定造型，不應稱為完全還原原設定。

## 新角色／道具後續修正：避免重犯

- 帽子：不要只在髮殼外放帽簷和過小尖頂。帽內被遮住的上段髮量要清除，帽冠需封閉並覆蓋髮帽輪廓；再建立連續帽簷、帽帶和尖頂。先確認128格的頂部空間，不能把超出網格的帽尖截平或保留穿出的頭髮。頭飾仍歸head。
- 頭紗：以包覆後腦的弧面、外展曲面、縱向皺褶及波浪邊生成，避免固定Y大平板。**整片頭紗歸head**，讓它隨轉頭；婚紗裙與後拖尾歸torso，不能把頭紗下段誤綁軀幹而分離。現行方格紗是淺色不透明幾何，不宣稱具有半透明薄紗材質。
- 長道具：目前手肘使用平面切分，跨過切分平面的法杖／十字鎬等會被切開。現有JSON相容作法是持物側整臂停用bend，代價是該側手肘不彎。若要保留手肘與剛性道具，需另外設計下段歸屬或附件機制，不可聲稱現有格式已支援。短鼓棒可全部放進下段半空間，須逐格驗證沒有被切到上段。
- 愛心：小尺寸採一致的雙圓頂、中央凹口與尖底遮罩；避免多個厚橢球疊成平頂或用內層色塊蓋掉凹口。
- 鬼火／愛心／浮書：既有範例為頭部綁定的周身懸浮造型，不是獨立粒子、繞行或飛行動畫。生成時及交付說明必須區分。
- 電子琴、摺疊桌、筆電、鼓組、立地麥克風：完整道具及支架歸torso，不併入手臂，讓雙手維持獨立活動；目前不帶演奏發聲功能。
- 電子琴：演奏者在較大Y一側，黑鍵靠遠側、白鍵後半段，黑鍵中心對準白鍵間隙；每7個白鍵按2顆／3顆交替。譜架置於遠離演奏者的一側，頂部向遠側後傾，樂譜面朝演奏者。不要把譜架放在近身鍵盤邊。
- 琴架／桌架：使用前後有深度的支架、上方承托橫桿、中心接軸和接地底腳；驗證琴身與架頂實際接觸，不能只有一片扁平X。
- 麥克風：檢查頭部與麥克風幾何間距，不只看正面。曾因膠囊過高、過近而插入下巴；需向前移並降低，另測合理轉頭。中立站姿無碰撞不等於所有動作自動避碰，現有應用沒有碰撞解算。
- 貓耳毛線帽：前後厚度以約3～4格為起點，不做成10多格厚塊。可將左右耳各兩種形態的差分加入對應browLeftNormal／Raised與browRightNormal／Raised；要對兩狀態聯集寫完整替換／刪除資料，缺席處還原帽體，避免殘留上一姿態或挖空帽子。維持跨五官ownership不衝突。這是眉毛狀態觸發的兩段姿態，不是物理連續擺動。
- 衣服裝飾投影遇到前方道具時，要只取衣服支撐面，不可直接取整個torso的最小Y，否則西裝翻領／胸飾會被畫到筆電或麥克風上。優先分開保存衣服與道具的實心遮罩，再投影服飾紋路。範例的Y區間過濾只適用該模型，不能當成通用衣服辨識。

修復上傳JSON時先以使用者檔案為準；除指定幾何及必要的歸屬／表情外，逐項保留原軀幹、四肢、支點、面部patch、設定及匯出欄位。檢查144組表情與正／側／背視角；有連動時另檢查各狀態切換，不把預覽圖當成真人追蹤測試。

## 目前維護入口與同步邊界

| 檔案／目錄 | 職責 |
| --- | --- |
| index.html | 網站首頁與入口、grid3D Actions下載導引；不是桌面播放器 |
| character-builder.html／character-player.html | 根目錄網站單檔成品，維持v19行為 |
| motion-source/ | 網頁拆分原始碼，改動後須重建根目錄成品 |
| desktop/index.html | 桌面播放器，內含appCode／coreCode與桌面橋接；目前v1.6.1 |
| desktop/main.cjs／preload.cjs | Electron透明視窗、防背景節流、攝影機與視窗控制 |
| desktop/build-folder.cjs | 複製執行環境及白名單payload、清空舊輸出、驗證結果 |
| desktop/test-package.cjs | 模擬Windows／Mac打包測試，不需下載Electron |
| .github/workflows/build-app.yml | 根目錄三平台Actions |
| EX/ | 使用者自行管理的範例JSON，不刪除／覆蓋，不進應用包 |

合併儲存庫不等於程式碼自動共用。網站成品與桌面成品目前各自保留；不可直接用舊character-player.html覆蓋desktop/index.html，會遺失六部位勾選與桌面橋接。若要同步共用功能，先比對兩邊、保留桌面差異，再重建及驗證。

## 桌面：六部位動補應用範圍

`settings.captureParts`以head、torso、leftHand、rightHand、leftFoot、rightFoot為鍵，布林值表示是否套用動捕。缺值預設true。UI依序是頭部、軀幹、左手、右手、左腳、右腳，左右仍以角色自身為準。

- 取消勾選立即保留當下顯示的世界矩陣；四肢保留上／下段，含手肘／膝蓋，不只保留局部角度。
- 未勾選的肢體不得繼承新的軀幹追蹤而漂移；未勾選頭部亦維持世界姿勢。
- 頭部項目僅控制轉頭；眼口眉繼續追蹤。臉部逾時復位不可改掉未勾選頭部的姿勢。
- 勾回後恢復該部位的動捕套用；切手動仍可編輯手動角度。攝影機啟動前應擷取未勾選的手動姿勢，重啟鏡頭不可清掉既有維持姿勢。
- `captureHolds`屬當次工作階段，不寫入JSON。勾選狀態寫入JSON；重新載入角色從JSON手動姿勢開始。GLB烘焙當下顯示姿勢。
- 程式以captureIDs／captureEnabled／captureActive／rememberCapturePose／primeCaptureHolds配合getGroups、effectiveBody、effectiveOverlay及輸入／序列化處理。captureHolds與原poseLocks不同；clearBody清舊追蹤資料時不可連帶抹掉captureHolds。
- 舊3秒鎖定UI在桌面已隱藏，現行操作以六個勾選為準；網頁v19仍保留舊鎖定UI，勿混寫版本。

## 網頁v19：缺失保持與3秒鎖定

`settings.holdMissingPose`缺值預設true。腿部完整鏈要求髖／膝／踝有效；不完整時不加入該腿的新追蹤，保留最後有效世界姿勢，無歷史則使用原手動／中立站姿。左右腿獨立，不新增腳底定位或地面位移演算法。

網頁的poseLocks在倒數3秒結束時擷取所選軀幹／四肢姿勢；臉部與頭部不屬此舊鎖定範圍。heldLimbs／heldTorso是自動缺失保持，poseLocks是明確鎖定，後者優先。網頁clearBody會清理它們並取消倒數。此段描述不可套成桌面六部位勾選的重置行為。

## 辨識資訊面板

.detection-info列出來源、左右眼嘴眉、校正後頭部角度及軀幹／四肢有效狀態。video.capture-sensor在畫面外維持播放，不可用停止串流的方式隱藏。狀態須區分新辨識、逾時、沿用姿勢、未套用動捕及手動。VMC不得標示全身。UI結果不存JSON；匯出HTML清掉即時欄位後重新初始化。

## 桌面打包與EX排除：不可違反

主儲存庫 https://github.com/anshaer/grid3D ，網站 https://anshaer.github.io/grid3D/ ，下載入口 https://github.com/anshaer/grid3D/actions/workflows/build-app.yml 。

APP_FILES只允許main.cjs、preload.cjs、index.html、assets/cube.png、assets/cube.ico、assets/cube.svg，再產生精簡執行用package.json。只複製官方Electron執行環境與上述清單，不可複製整個儲存庫或desktop目錄。圖示限指定檔案，新增payload要同步改白名單與測試。

每次清空安全的建置輸出，再重建／驗證payload。EX、examples、motion-source、網站、MD、測試、工作流程及開發用node_modules不進resources/app。官方Electron本身所需的執行環境檔案／授權仍保留。Windows的electron.exe不得被改圖示或重新封裝成自解壓EXE；Mac保留framework相對symlink，更新Info.plist後沿用codesign／ditto流程，不能宣稱本地簽章等於Apple公證。

Actions的run工作目錄是desktop；uses步驟的upload-artifact路徑仍需從根目錄明確寫desktop/dist/VoxelCharacter或desktop/VoxelCharacter-macOS.zip。自動push觸發只包括desktop/**及.github/workflows/build-app.yml，保留workflow_dispatch。三種artifact名稱維持原Windows-folder／macOS-AppleSilicon／macOS-Intel；歷史成品不會搬到新儲存庫，不能把舊run/artifact ID改個repo名就當成新連結，也不能沿用舊SHA-256。

## 驗證與交付

1. 僅改文件時，確認路徑、版本、現行實作及MD連結一致，不宣稱程式功能已同步到未改入口。
2. 打包改動執行cd desktop && npm test；測試精確白名單、根目錄與desktop內EX排除、舊輸出清理、Windows位元組、Mac符號連結（支援該測試的主機）。
3. 動捕勾選改動須驗證六部位分別維持、軀幹不帶動未勾肢體、彎折、重新勾選恢復、臉部持續、逾時、切來源／重啟及JSON還原。原DOM／canvas模擬測試需相應執行環境，不能只憑語法檢查宣稱已過。
4. 完整原始碼交付ZIP必須包含EX範例，但不含Git內部資料；使用者合併上傳時保留既有EX。只有桌面應用成品排除EX。GitHub內建Code → Download ZIP仍包含儲存庫裡的EX，此功能無法用應用白名單排除。
5. 真正Windows／Mac成品要由Actions完成後下載。尚未執行的遠端建置、真人鏡頭及各平台測試，不得標示成功。

## EX範例索引與保留規則

EX共有12個動捕角色JSON，請在README及首頁提供下載入口，不要因桌面成品排除EX就把網站範例入口或原始碼交付內容刪掉。

- [上班族](EX/上班族.json)：筆電與摺疊桌
- [公主](EX/公主.json)：金髮粉色禮服、周身愛心
- [哥特](EX/哥特.json)：歌德龐克服裝
- [婚紗](EX/婚紗.json)：西式長裙與頭紗
- [學生](EX/學生.json)：藍髮水手服
- [學生2](EX/學生2.json)：貓耳毛線帽、眉毛連動
- [殭屍](EX/殭屍.json)：中式殭屍、周身鬼火
- [法師](EX/法師.json)：紅髮法師、法杖與異火
- [禮服](EX/禮服.json)：中式婚紗、大鳳冠
- [鋼琴](EX/鋼琴.json)：電子琴與琴架
- [駐唱](EX/駐唱.json)：立地麥克風
- [鼓手](EX/鼓手.json)：多鼓組與鼓棒

這批均為ansha-chibi-studio-v1，不是voxel-editor-v1固定場景模型。維護文件時保留使用者的範例名稱與檔案內容，不用重新生成模型替代既有EX。完整原始碼ZIP與範例專用ZIP可包含EX；Windows／Mac應用payload與Actions應用artifact必須排除EX。
