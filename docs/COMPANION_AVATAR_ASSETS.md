# Generated companion avatars

This branch maps the following companions to unique transparent-background assets at `public/avatars/<Name>.webp`: Alice, Irene, Yuna, Haruka, XiaoYu (Xiao-Yu), Nicha, Mei, Anika, Sofia, Amelie, Olga and Lucia (internal preset id remains `luca`).

The corresponding binary assets are packaged separately as **JOE-Tutor-12-Companion-Avatars.zip**. Extract its `public/avatars/` folder into the repository root **before merging this branch**. The source code alone is insufficient and the URLs will return 404 without these files.

Chloe remains untouched. Noa, Lena and Ada have no confirmed standalone generated portraits and are unchanged. This batch has no newly generated male avatars.

Validation: after adding the assets, run `npm run build`, and verify each `/avatars/<Name>.webp` loads at your Vercel Preview deployment before merging.
