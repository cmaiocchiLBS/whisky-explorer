# Whisky Explorer

Whisky Explorer is a small static website. Choose a distillery and it shows up to three other distilleries with the closest recorded flavour profiles in the same accepted flavour group. It runs in the browser from the files in this folder.

## Files to keep together

- `index.html` — the website page and its controls. It must be at the top level of the published website folder.
- `styles.css` — page layout and styling.
- `app.js` — reads the local data file, ranks recommendations and draws the score comparisons.
- `favicon.svg` — the small W icon shown in a browser tab.
- `whisky_with_clusters.csv` — all 86 workshop distillery records, their flavour scores, location columns and accepted four-cluster labels.
- `tests/` — a small repeatable recommendation check and notes; the website itself does not need this folder to run.

Keep the page, style sheet, script, icon and CSV in the same folder. Their links are relative (`./...`), so they continue to work when the site is hosted below a GitHub Pages project address such as `https://owner.github.io/repository/`.

## Open a local preview

Opening `index.html` by double-clicking it may prevent the browser from reading the nearby CSV. Use a simple local web server instead:

1. Open Terminal (Mac) or PowerShell (Windows) in this folder.
2. Run `python3 -m http.server 8000` (on Windows, `py -m http.server 8000` also works).
3. Visit <http://localhost:8000> in your browser.
4. Stop the server with **Ctrl+C** in that terminal.

Start the same command again whenever you want another preview. Python serves the files for this local preview; it does not run the workshop analysis. On GitHub Pages, the static host serves the same files directly, with no Python process.

## Data source and permissions

The flavour records originate from David Wishart's classification of Scotch single malts, associated with *Whisky Classified: Choosing Single Malts by Flavour* and the University of Strathclyde's Nessie outreach whisky dataset. The included CSV contains the workshop's 86 distillery records with their original columns and the already accepted four-cluster assignments in an added `Cluster` column. The website reads this bundled copy; it does not download the source data or depend on the surrounding course folders.

The course files do not state a redistribution licence or permission for the flavour data. Confirm that you may republish the data before uploading this folder to a public repository. The CSV also contains distillery postcodes and coordinates; these are location details for businesses, but they are not used in recommendations. The website code and icon are local and do not load third-party assets.

Sources: David Wishart, *Whisky Classified: Choosing Single Malts by Flavour* (Pavilion Books, 2009); the University of Edinburgh's [Scotch Whisky characteristics dataset record](https://datashare.ed.ac.uk/items/6e468d11-5fe0-43ec-98a8-5c9d9c7d7b99), which describes the scores and cites the University of Strathclyde Nessie data as its source; and Luba Gloukhov's [86-whisky analysis and data description](https://www.r-bloggers.com/2013/12/k-means-clustering-86-single-malt-scotch-whiskies/), which also identifies the Nessie data source.

## Matching method

The website uses the twelve recorded characteristics in this order: Body, Sweetness, Smoky, Medicinal, Tobacco, Honey, Spicy, Winey, Nutty, Malty, Fruity and Floral. It standardizes each feature over all 86 distilleries using the population standard deviation, calculates Euclidean distance between standardized profiles, and ranks only other distilleries with the selected whisky's saved `Cluster` label. An equal-distance tie is ordered by distillery name. The app uses the accepted **k = 4** labels in the CSV and does not run k-means again.

Location has no effect on recommendations. The charts show the original scores on a 0–4 scale, not standardized values. A distillery has one broad profile here; individual bottles, age statements, batches and production changes are not represented. The taste scores are broad classifications, not a guarantee of a person's experience. Similar recorded flavours do not guarantee personal enjoyment. The four groups are the selected model's practical groupings, not proof that Scotland has exactly four natural whisky types.

## Local checks

From this folder, run `python3 tests/verify_recommendations.py` to check the saved labels and the Oban and Lagavulin recommendations. This check uses only the CSV in this folder and does not fit a model. See `tests/TEST-NOTES.md` for the comparison results and tie rule.

## GitHub Pages

Publish the contents of this folder together, with `index.html` at the top level of the publishing source. The relative links and CSV request work under the repository subpath in a project site. If your existing course repository cannot use this folder as its Pages publishing source, GitHub Pages branch publishing accepts the repository root or a top-level `/docs` folder; a GitHub Actions publishing workflow can deploy files from another folder. Check that the chosen publishing artifact contains `index.html` at its top level. GitHub's [Pages setup instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site) describe those options.
