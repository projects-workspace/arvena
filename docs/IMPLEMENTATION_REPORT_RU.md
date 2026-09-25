# Arvena — итоговый отчёт: методология и структура знаний

25 сентября 2026 года. Реализация рабочего сайта, без production-релиза.

## 1. Исходное состояние и сохранённая работа

Ветка `feat/arvena-stage1-alignment`, исходный HEAD `73959c3edcf7d807abc0609ea9f37415ea5512fe`. Более поздних implementation-коммитов не было. До начала работы уже были изменены `AGENTS.md`, `README.md`, `supabase/README.md`, а `PROJECT_STATE.md` был untracked. Эти изменения не откатывались и не включались в implementation-коммит. Снимок Stage 4 обновлён точечно и оставлен вне коммита вместе с ранее существовавшей документационной работой.

## 2. Реализовано и переиспользовано

Расширена How We Select, согласованы About, участие, производители/специалисты, Work With Arvena, Craft и Development. Добавлен небольшой публичный реестр `knowledge-data.js` и его рендерер `knowledge.js`. Сохранены английский язык, существующий дизайн, темы, навигация, router, Clean Water и два его подробных материала. Нового framework или CMS нет.

Десять предметных направлений получили разные содержательные карты: границы, подразделы, классы подходов, вопросы исследования, первые шаги, доступное чтение, связи, предложения и редакционная история. Восемь контекстных входов представлены без копий: Home и Kitchen используют страницы доменов, Craft — существующую страницу; пять контекстов имеют самостоятельные маршруты. Дом начинается с карты связей. Одежда объясняет всё изделие; поля — разные явления и пределы измерений.

Всего: 38 канонических маршрутов, 2 сохранённых alias и существующие динамические platform/offer/provider-маршруты. Локальный поиск содержит 18 записей знаний: 10 карт, 6 контекстных записей (включая Craft), 2 подробных материала Clean Water. Это не 18 предложений. Статических offers/providers не добавлено.

## 3. Карта тематических страниц

В таблице статус относится к знаниям. Наличие offers проверяется независимо через каталог. Идентификаторы доменов сохранены без замены на D01–D10.

| Маршрут | Назначение / тип | Состояние знаний | Связь |
|---|---|---|---|
| `#/solutions/water` | Карта направления | Карта и подробные материалы | `water` |
| `#/solutions/air-and-indoor-environment` | Карта направления | Карта темы доступна | `air-and-indoor-environment` |
| `#/solutions/food-kitchen-and-preservation` | Карта направления | Карта темы доступна | `food-kitchen-and-preservation` |
| `#/solutions/household-materials` | Карта направления | Карта темы доступна | `household-materials` |
| `#/solutions/cleaning-and-household-products` | Карта направления | Карта темы доступна | `cleaning-and-household-products` |
| `#/solutions/personal-everyday-products` | Карта направления | Карта темы доступна | `personal-everyday-products` |
| `#/solutions/energy-and-resource-efficiency` | Карта направления | Карта темы доступна | `energy-and-resource-efficiency` |
| `#/solutions/environmental-monitoring` | Карта направления | Карта темы доступна | `environmental-monitoring` |
| `#/solutions/gardens-soil-and-growing` | Карта направления | Карта темы доступна | `gardens-soil-and-growing` |
| `#/solutions/homes-buildings-and-land-systems` | Карта направления | Карта темы доступна | `homes-buildings-and-land-systems` |
| `#/solutions/homes-buildings-and-land-systems` | Home as a system — повторное использование страницы | Состояние соответствующего домена | `water`, `air-and-indoor-environment`, `food-kitchen-and-preservation`, `household-materials`, `cleaning-and-household-products`, `personal-everyday-products`, `energy-and-resource-efficiency`, `environmental-monitoring`, `gardens-soil-and-growing`, `homes-buildings-and-land-systems` |
| `#/contexts/clothing-footwear-textiles` | Clothing, footwear and textiles | Контекстный обзор доступен | `personal-everyday-products`, `household-materials`, `cleaning-and-household-products` |
| `#/solutions/food-kitchen-and-preservation` | Kitchen and storage — повторное использование страницы | Состояние соответствующего домена | `food-kitchen-and-preservation`, `water`, `household-materials`, `cleaning-and-household-products`, `energy-and-resource-efficiency` |
| `#/contexts/sleep-and-rest` | Sleep and the rest environment | Контекстный обзор доступен | `air-and-indoor-environment`, `household-materials`, `personal-everyday-products`, `environmental-monitoring`, `energy-and-resource-efficiency` |
| `#/contexts/electronics-fields-measurement` | Electronics, fields and measurement | Контекстный обзор доступен | `environmental-monitoring`, `energy-and-resource-efficiency` |
| `#/craft-local` | Makers, local production and provenance — повторное использование страницы | Контекстный обзор доступен | `household-materials`, `personal-everyday-products`, `food-kitchen-and-preservation`, `gardens-soil-and-growing` |
| `#/contexts/traditional-knowledge-new-developments` | Traditional knowledge and new developments | Контекстный обзор доступен | `water`, `food-kitchen-and-preservation`, `household-materials`, `personal-everyday-products`, `gardens-soil-and-growing` |
| `#/contexts/start-without-buying` | Start without unnecessary purchases | Контекстный обзор доступен | `water`, `air-and-indoor-environment`, `food-kitchen-and-preservation`, `household-materials`, `cleaning-and-household-products`, `personal-everyday-products`, `energy-and-resource-efficiency`, `environmental-monitoring`, `gardens-soil-and-growing`, `homes-buildings-and-land-systems` |

| Другой маршрут | Роль / состояние |
|---|---|
| `#/how-we-select` | Публичная методология v1.0; alias `#/methodology` |
| `#/about` | Идентичность и независимый поиск, с переходом к методологии |
| `#/participate` | Вклад и честное состояние доступных каналов |
| `#/participate/producers` | Подготовка данных и пределы сотрудничества |
| `#/participate/work` | Возможные исследовательские роли, не действующие вакансии |
| `#/development` | Явно будущие исследования, разработки и доступность |
| `#/solutions` | Десять направлений и восемь контекстных входов |
| `#/explore` | Поиск по знаниям и опубликованным offers, раздельные типы и счётчики |
| `#/offers` | Каталог с фильтрами темы/домена/класса и состоянием сервиса |
| `#/solutions/clean-water` | Сохранённый образовательный guide, связи с каталогом |
| `#/solution-classes/point-of-use-filtration` | Сохранённый класс решения; alias `#/products/certified-point-of-use-filter` |

## 4. Методология и пределы утверждений

Публичная версия адаптирует раздел 19 Framework и согласованные уточнения: начинать с потребности; искать широко, особенно среди малых производителей и независимых создателей; проверять конкретное утверждение, версию и условия; различать источники, испытания, опыт, традиционное использование и неизвестное; раскрывать значимые интересы, включая Arvena; учитывать полную стоимость, ремонт и простые альтернативы; разделять AI-подготовку, человеческое решение и техническую публикацию; пересматривать выводы.

Показана цепочка от потребности и карты подходов до исследования, человеческого решения, публикационного пакета и пересмотра. Открытость не приравнена к одинаковой доказательности. Коммерческая связь не изображена доказательством недобросовестности. Нет вымышленных товаров, отзывов, специалистов, исследований, результатов, партнёров или одобрений. Не заявлены действующие Arvena Verified, лаборатория, фонд, клиническая программа или сформированная экспертная сеть. Публичная дата — редакционная, не дата научной проверки.

`docs/METHODOLOGY_SCOPE.md` отдельно фиксирует реализованные положения и отложенные решения. Исходные Draft/Proposal не переименованы и не переписаны.

## 5. Связи, поиск и каталог

Домены используют существующий `domain_slug`, класс фильтрации — `solution_class_slug`. Узкие контексты используют явный реестр `offerLinks` с одобренными slug реальных offers. Сейчас он пуст: команда ещё не передала такие связи. Совпадение широкого домена не превращает произвольный бытовой продукт в одежду или средство защиты.

Одна запись может иметь несколько контекстных ссылок без копирования текста и даты. Связанные блоки разрешают ссылки только через текущие опубликованные offers. Фильтры `?topic=`, `?domain=` и `?class=` сохраняются в hash URL и переживают refresh. Неизвестный фильтр не показывает весь каталог. Поиск учитывает также подразделы карты и разделяет типы знаний и offers.

Нулевой результат появляется только после успешной загрузки. Ошибка API показывает недоступность и Retry. Черновик/hidden не попадают в выдачу, связанные блоки и счётчики; это проверено локальными fixtures. Повторная загрузка и навигация обновляют состояние каталога. Live realtime-обновления не добавлялись.

## 6. Участие

Общий публичный контакт/приём материалов пока не настроен. Нет фиктивной формы или обещания успешной отправки; регистрация не предлагается как обход. Публичные страницы объясняют, как подготовить источник, исправление, возражение, разрешённый полевой материал или описание потребности.

Существующие assigned provider representatives сохраняют corrections только для собственных listings; scoped contributors — разрешённые материалы с модерацией; editors — существующие editorial-инструменты. Login не выдаёт дополнительных прав. Новые публичные формы, открытое редактирование и расширение полномочий отложены.

## 7. Передача исследований

Документ: `docs/RESEARCH_PUBLICATION_HANDOFF.md` — “How to hand over research for publication”. Он содержит реальные ID/маршруты, минимальные пакеты для обзора, класса/сравнения, research note, provider, offer и существенного исправления, blank template, точное сопоставление с `public_copy` и человеческим review.

Существенный предел: существующий database publisher публикует offers, а не универсальные статьи. Knowledge-материалы передаются утверждённым текстом в source-controlled implementation. Внутреннее досье остаётся отдельно. Это не новый импортёр и не новые обязательные поля базы.

## 8. Проверка

- Source integrity / JavaScript syntax: PASS; 38 canonical routes, 140 статических уникальных ID, корректные ссылки/реестр и сохранённый protected contract.
- Preview server: 4/4 PASS, включая новые runtime-файлы и запрет доступа к документации, snapshot, исходникам базы и служебным файлам.
- Knowledge browser: 358 assertions PASS, 35 маршрутов на 1440, 390 и 320 px; draft/hidden/published, одна запись в нескольких контекстах, withdrawal, фильтры, refresh, поиск, ноль, ошибка/retry, gates, mobile menu, keyboard focus, темы, изображения и отсутствие overflow/runtime errors.
- Дополнительная финальная проверка: поиск по подразделу fermentation, ссылки ARIA после динамического рендера, читаемые тёмные ссылки, отсутствие runtime errors — PASS.
- Существующий Auth/Data API suite: 60 assertions PASS на изолированном локальном Supabase, включая ownership, approval, revocation, moderation и analytics.
- Существующий account/editorial browser suite: PASS для login/session persistence, saves, preferences, provider corrections, contributor moderation, themes/navigation; zero console/runtime errors.
- Desktop/mobile screenshots просмотрены. Механический design detector указал на существующие стилевые паттерны; идентичность сайта сохранена. У новых ссылок исправлен явный цвет для обеих тем.
- Оба config-файла, оба migration-файла, `editorial.js` и sourcing submit handler сверены с исходным коммитом: byte-identical. `git diff --check` прошёл.

Это локальная проверка, не новый remote RLS-аудит и не production QA. Test-only preview использовал локальные email controls для fixture-аккаунтов; в рабочей конфигурации email выключен.

## 9. Схема, remote и расходы

Новые миграции не создавались. Remote schema/data writes, RLS/Auth changes, выдача постоянных ролей, SMTP, доменные/платные операции, sourcing/B3 и production deployment не выполнялись. Для локальных regression tests применена неизменённая существующая marketplace-миграция к изолированному тестовому экземпляру; синтетические записи оставались только там. После проверки тестовый экземпляр и его данные остановлены/удалены.

Обычный локальный runtime читал публичный каталог. Исторические личные заявки и private remote-досье не открывались. В Vercel выполнена только read-only проверка: project/team IDs совпали с локальной конфигурацией, production branch — `main`. Connector/CLI доступа не дали; проверка сделана через проверенный браузерный профиль без изменения настроек.

## 10. Git

Implementation commit: `0d72750` — `Add public methodology and linked knowledge maps`. Отчёт добавляется отдельным documentation-коммитом. Итоговый SHA и подтверждение push приводятся в завершающем ответе. Push — обычный, в `feat/arvena-stage1-alignment`, без force и без merge в `main`.

Предшествующие изменения `AGENTS.md`, `README.md`, `supabase/README.md` и untracked `PROJECT_STATE.md` остаются вне этих коммитов. Snapshot обновлён по задаче; рабочее дерево поэтому намеренно не полностью чистое.

## 11. Как открыть

Из корня проекта: `python3 scripts/serve_preview.py --port 8002`.

Адрес: `http://127.0.0.1:8002/#/solutions`. Запущенный allowlisted local preview оставлен доступным. Отдельный Vercel Preview вручную не создавался. Production не развёртывался и не продвигался.

## 12. Защищённые границы

`ARVENA_PLATFORM_ENABLED: true`, `ARVENA_EMAIL_DELIVERY_ENABLED: false`, `requestsEnabled: false` сохранены. Signup/reset в рабочем интерфейсе закрыты; sourcing/B3 не активирован. Protected request migration, payload и handler сохранены. Commonry и другие проекты не изменялись.

## 13. Что требуется от команды дальше

Блокеров для выполненной локальной реализации нет. Следующий содержательный вход — один реальный утверждённый research-пакет: точный объект/ID, текст, источники и пределы выводов, права на медиа/полевые материалы, disclosure, версия и настоящее человеческое одобрение. Для offers нужны существующий опубликованный provider и валидный контракт; для узких контекстов — явное одобрение связей. Remote-публикация, новые классы базы и production-релиз остаются отдельными разрешёнными задачами.
