# ИНСТРУКЦИЯ ПО РАБОТЕ С ПРИЛОЖЕНИЕМ

#### [Ссылка на приложение](https://khanbank.netlify.app/)

## Файловая система

1) public/assets - Шрифты, фотографии, иконки
2) src/components - тут хранятся общие компоненты приложения
3) src/components/store - главный стор а так же папка со слайсерами для каждой страницы
4) src/pages - за счет этой папки осуществляется навигация по сайту. Каждая папка это отдельная страница (**ВАЖНО!** название папки должно быть с маленькой буквы)
5) _app - главный файл в который помещаются все компоненты/страницы
6) src/api - все что связано с бэком
7) src/projects - ваши проекты
8) src/styles - глобальные стили приложения

## Работа с гитом
1) **НИ В КОЕМ СЛУЧАЕ НЕ ПУШИТЬ В main ВЕТКУ!** main ветка с полностью рабочей версией приложения
2) Предварительная версия хранится в ветке **dev**
3) Чаще делайте коммиты. Поработали, добавили/удалили что-то, закомитьте
4) Коммиты должны быть короткими и четко описывать что вы сделали
5) Коммиты пишем на русском


## Правила
1) Не трогать _app.js
2) Называйте компоненты, файлы, папки добавляя в ее имя название своей страницы

```bash
home/
├── homeComponents/
│   ├── homeButton.jsx
│   ├── homeInp.jsx
│   ├── homeStyles.module.scss
│   └── ...
```
2) При работе над страницей все ее файлы должны находится внутри нее самой
3) Использовать систему модулей при создании стилей example.**module**.scss (из-за этого изменится формат написания и создания стилей, ориентируйтесь по уже готовым страницам в проде)
4) Изменился формат добавления нескольких классовых имен в один объект (теперь нужно использовать библиотеку "cn", ориентируйтесь по уже готовым страницам)
5) Изменить стили через id не получится
6) Если нужно добавить что-то в Head страницы, то используйте встроенный компонент 
```bash
import Head from "next/head";
export default function Example() {
  return (
    <>
      <Head>
        <title>This is example page</title>
      </Head>
      <main>
          hi
      </main>
    </>
  );
}
```
7) Используйте Prettier для одинакового формата кода