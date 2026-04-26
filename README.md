# nsysu-math208

中山大學 **MATH 208 資料結構（Data Structure）** Spring 2026 課程網站，採 Jekyll + GitHub Pages 部署。

- **線上站台：** <https://phonchi.github.io/nsysu-math208/>
- **授課教師：** 鍾思齊（理 SC 2002-4）
- **助教：** 黃冠欽（理 SC1011-1）、陳姵涵（理 SC1015-2）
- **教科書：** [Problem Solving with Algorithms and Data Structures using Python, 3rd Edition](https://runestone.academy/ns/books/published/pythonds3/index.html)（Miller / Ranum）

> 本 repo 兼任**雙重角色**：(1) Jekyll 課程站台原始碼；(2) 教學投影片所需互動資產（動畫 / 互動 quiz / 字卡）的 CDN 後端 — 課程 notebook 透過 `https://cdn.jsdelivr.net/gh/phonchi/nsysu-math208@<sha>/extra/...` 載入 `extra/` 下的檔案。

---

## 資料夾結構（實際內容）

```
.
├── _config.yml              # Jekyll 設定，含課程名稱 / baseurl=/nsysu-math208 / Spring 2026
├── Gemfile, Gemfile.lock    # Ruby 依賴：minima 2.5 + github-pages gem + jekyll-feed
├── LICENSE                  # 沿用模板的 LICENSE
│
├── index.md                 # 首頁（layout: home），含 syllabus 連結 / FB 社團 / Office hour
├── lectures.md              # /lectures/ 列表頁
├── assignments.md           # /assignments/ 列表頁
├── schedule.md              # /schedule/ 自動生成課表
├── materials.md             # 推薦書、MOOC、模擬器、程式環境、練習網站
├── project.md               # 期末專題（目前為佔位）
│
├── _lectures/               # 每週講義 markdown（一檔 = 一筆 lecture frontmatter）
│   ├── 01_Introduction.md            # 2026-02-23
│   ├── 02_Introduction.md            # 2026-03-02 OOP / Magic methods
│   ├── 03_Algo.md                    # 2026-03-08 Algorithm Analysis (Ch2)
│   ├── 04_array.md                   # 2026-03-16 Arrays & Linked list (Ch3+Ch4)
│   ├── 05_Linear.md                  # 2026-03-23 Linked list & Stack (Ch5)
│   ├── 06_week6.md                   # 2026-03-30 Stack & Queue
│   ├── 07_week7.md                   # 2026-04-06 Spring Break
│   ├── 08_week8.md                   # 2026-04-20 Recursion (Ch6)
│   └── 09_week9.md                   # 2026-04-27 Searching & Sorting (Ch7)
│
├── _assignments/            # 作業 / Quiz
│   ├── 01_HW1.md            # 2026-03-03，截止 03-20
│   ├── 02_HW2.md
│   ├── 03_HW3.md
│   └── 03_Quiz1.md          # 2026-03-23 釋出，04-02 23:59 紙本繳交
│
├── _events/                 # 額外事件（exam / due / raw）
│   ├── evaluate.md
│   ├── sample_due.md
│   ├── sample_exam_due.md   # 期中考 2026-04-13
│   ├── sample_final_due
│   └── sample_raw_event.md
│
├── _data/
│   ├── nav.yml              # 上方 nav: Home / Schedule / Lectures / Assignments / Materials
│   ├── people.yml           # 講師 + 兩位助教資料
│   ├── late_policy.yml      # 遲交 / 抄襲 / 補交流程說明
│   └── previous_offering.yml
│
├── _layouts/                # default / home / page / post / lectures / assignments /
│                            # assignment / class / schedule
├── _includes/               # nav / header / footer / head / announcements / image /
│                            # embedpdf / exam_policy / late_policy / lecture_links /
│                            # schedule_row_{lecture,assignment,due,exam,raw_event}
├── _sass/                   # 6 個樣式 partial：_base / _header / _layout /
│                            # _mobile-header / _syntax-highlighting / _user_vars /
│                            # _fancy-image
├── _css/main.scss           # 整合 _sass partial 的入口
│
├── _images/                 # cover2 / home_page / logo / pattern / suggested_exercise
│   ├── pp/                  # 講師 + TA 大頭照（avatar.png 為預設、其餘為模板殘留）
│   └── screenshots/         # 模板 README 用的截圖
│
├── static_files/
│   ├── presentations/       # 9 章 RISE 投影片三件套（.ipynb / .html / .pdf）+ 章節 CSS
│   │                        # Ch1.ipynb ~ Ch9.ipynb（學生練習題）+ Ch?_sol.ipynb（解答）
│   │                        # Overview.pdf / course_outline.pdf / Midterm_sol.pdf
│   │                        # rise.css / draw.html / searching_sorting.html
│   └── assignments/         # HW1.{pdf,zip} ~ HW3.{pdf,zip} / Quiz1.pdf / Quiz1{,_new}_sol.pdf
│
└── extra/                   # ★★ ds_slides notebook 的 CDN 後端，不參與 Jekyll site
    ├── animations/          # chapter 7 互動動畫資產（11 檔）
    │   ├── ds07.css         # 樣式 source
    │   ├── ds07.js          # 引擎 source（BarVis + Animator + 9 frame generators）
    │   ├── seq.html, bin.html, hash.html
    │   ├── bubble.html, selection.html, insertion.html
    │   ├── shell.html, merge.html, quick.html
    │   └── （以上 9 檔對應 9 個動畫面板的 markup）
    ├── flashcards/          # jupytercards 用：ch1.json ~ ch9.json
    └── questions/           # jupyterquiz 用：ch1/ ~ ch9/ 各章節題目資料夾
```

---

## 站台部署

走 GitHub Pages，push 到 `main` 後 Pages 會自動 build。

`_config.yml` 關鍵設定：

| 欄位 | 值 |
|---|---|
| `baseurl` | `/nsysu-math208` |
| `url` | `https://phonchi.github.io/` |
| `course_name` | Data Structure |
| `course_semester` | Spring 2026 |
| `schoolname` | National Sun Yat-Sen University |
| `markdown` | kramdown |
| `permalink` | `blog/:year/:month/:title` |
| `collections` | `events` / `lectures` / `assignments`（皆 `output: true`）+ `announcements`（`output: false`） |

### 本機預覽

需要 Ruby + Bundler：

```bash
bundle install
bundle exec jekyll serve
```

開瀏覽器到 `http://localhost:4000/nsysu-math208/`。

---

## `extra/` 與課程投影片的關係

`extra/` 不是 Jekyll site 的一部分（GitHub Pages 不會把它列入 navigation 或 schedule），它的存在純粹是給 `ds_slides/` 的 notebook 透過 jsDelivr CDN 抓資產用。

- **動畫**（`extra/animations/`）：`ds_slides/07_Searching and Sorting.ipynb` cell 6 inline loader 從 `https://cdn.jsdelivr.net/gh/phonchi/nsysu-math208@<commit-sha>/extra/animations/` 抓 `ds07.css` / `ds07.js` 與 9 個 `.html` 面板。**SHA 在 notebook 中是 pin 死的** — 每次推新 commit 到 `extra/animations/` 後，必須同步 bump notebook 裡的 SHA，否則 jsdelivr edge cache 仍 serve stale。
- **字卡**（`extra/flashcards/ch<N>.json`）：`jupytercards` 載入。
- **題目**（`extra/questions/ch<N>/*.json`）：`jupyterquiz` 載入。

> Source-of-truth 仍在 `ds_slides/animations/`、`ds_slides/flashcards/`、`ds_slides/questions/`；本 repo 的 `extra/` 是鏡像 — 修改後要從 `ds_slides/` 同步過來再 push。

---

## 新增 / 修改內容

### 新增講義（lecture）

在 `_lectures/` 建一個 `.md`：

```yaml
---
type: lecture
date: 2026-MM-DD
title: <Lecture title>
hide_from_announcments: true
links: 
    - url: /static_files/presentations/<file>.pdf
      name: Ch?_Slides
    - url: /static_files/presentations/<file>.html
      name: Ch?_Slides_html
---
**Suggested Readings:**
- [Notebook](https://github.com/phonchi/nsysu-math208/blob/main/static_files/presentations/<file>.ipynb)
- Textbook Chapter ?
- [[Recorded video]](<youtube-playlist>)
```

可選 frontmatter：`tldr` / `thumbnail` / 多個 `links` 條目。

### 新增作業（assignment）

在 `_assignments/`：

```yaml
---
type: assignment
date: 2026-MM-DDT13:00:00
title: 'Homework #N'
pdf: /static_files/assignments/HW<N>.pdf
attachment: /static_files/assignments/HW<N>.zip
due_event: 
    type: due
    date: 2026-MM-DDT23:59:00
    description: 'Homework #N due'
description: '請繳交至網路大學'
---
```

也可加 `solutions:` 指向解答 PDF。

### 新增事件（exam / due / raw_event）

在 `_events/`：

```yaml
---
type: exam      # 或 due / raw_event
date: 2026-MM-DDT09:10:00
description: 'Midterm'
hide_from_announcments: true
---
```

`raw_event` 可帶額外 markdown body 與 `name:`、`hide_time:`。

### 修改 navigation / 講師資料 / 遲交政策

- 上方選單：`_data/nav.yml`
- 講師 / TA：`_data/people.yml`（圖片放 `_images/pp/`）
- 遲交政策：`_data/late_policy.yml`
- 期次（previous offering 連結）：`_data/previous_offering.yml`

### 修改頁面文字

- 首頁：`index.md`（含 syllabus / FB 群 / Office hour）
- Materials 推薦資源：`materials.md`
- Lectures / Assignments / Schedule / Project 標題與引言：對應 `*.md`

---

## 模板出處

本站台模板源自 [kazemnejad/jekyll-course-website-template](https://github.com/kazemnejad/jekyll-course-website-template)（原作再 fork 自 [svmiller/course-website](https://github.com/svmiller/course-website)），已大幅在地化並加上 `extra/` CDN 後端機制。
