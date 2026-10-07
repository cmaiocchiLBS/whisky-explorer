# Whisky Explorer test notes

## What was checked

- Read the accepted comparison code in `../main/analysis.py`: it uses the twelve flavour columns in the app, `StandardScaler` (population standard deviation), Euclidean distance, and the existing selected k-means solution with `k = 4`, `random_state = 42`, and `n_init = 20`. The website does not refit this model.
- Compared all 86 app CSV records with the original workshop data and the saved accepted k = 4 table. The original columns and values are unchanged, and every app `Cluster` value matches `KMeansClusterK4` in the saved table.
- Confirmed cluster sizes: Cluster 1: 33; Cluster 2: 32; Cluster 3: 15; Cluster 4: 6.
- Recomputed the within-cluster recommendations with the accepted twelve-feature standardisation and Euclidean distance. Oban is Cluster 3; its nearest eligible whisky is Balblair at 2.634242982549. Lagavulin is Cluster 4; its nearest eligible whisky is Laphroig at 2.537315990058. Both nearest results are unique (no equal-distance tie within 1e-12).
- `verify_recommendations.py` repeats the app-local data, assignment, nearest-name, distance, tie, and self-exclusion checks without refitting a model or reading files outside this app folder.
- Interacted with the browser preview: selected Oban and saw Balblair, Isle of Jura and Glenmorangie; selected Lagavulin and saw Laphroig, Clynelish and Caol Ila. Both pages showed the first recommendation's twelve-score comparison, updated with the selection. Neither chosen distillery appeared in its own recommendations.
- Tested the whisky selector, submit button, comparison expand/collapse controls, reset control, required-selection validation and home link. The reset control cleared the selection and restored the introductory state; submitting an empty selection prompted the visitor to choose a whisky. The home link returned to the app's top-level page.
- Checked that `index.html` is at this folder's top level and that each local page reference exists. Resolved the app's relative file URLs against a sample GitHub Pages project base (`https://owner.github.io/repository/`); they remain within `/repository/`.
- Scanned every app file for common leaked API-key/private-key patterns, email addresses and absolute local user paths; found none. Source inspection found no AI/LLM, paid API, remote script, stylesheet, font or data endpoint. The only runtime data request reads the bundled CSV.
- Started the app's local preview and verified successful requests for the page, CSS, JavaScript, CSV and icon. Added a local favicon after the browser's automatic favicon request initially returned 404; the request succeeds after the fix.

## Tie rule and differences

The app ranks equal computed distances by distillery name alphabetically. The workshop analysis uses `numpy.argmin`, which selects the first tied row in source order. Oban's and Lagavulin's nearest distances are unique, so this difference in tie handling changes neither result. The calculated distances agree with `main/analysis.py`; the display does not show numeric distances, only the ranked profiles and score comparison.

The app folder contains no credentials, personal email addresses or local user paths. The included CSV does contain distillery names, postcodes and coordinates, which are business location data. The dataset's public redistribution permission is not recorded in the course files and still needs a human check before a public upload.

## Re-run

From this folder, run `python3 tests/verify_recommendations.py`. For an interactive local preview, follow the README instructions to serve this folder and open `http://localhost:8000`.
