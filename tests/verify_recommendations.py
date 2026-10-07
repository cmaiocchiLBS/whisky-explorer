"""Check the website data and its accepted Oban/Lagavulin matches.

Run from any directory with Python 3:
    python3 tests/verify_recommendations.py

This test reads only the CSV next to the app. It does not fit or alter a model.
"""

import csv
import math
from pathlib import Path


APP_DIR = Path(__file__).resolve().parents[1]
CSV_PATH = APP_DIR / "whisky_with_clusters.csv"
FEATURES = [
    "Body", "Sweetness", "Smoky", "Medicinal", "Tobacco", "Honey",
    "Spicy", "Winey", "Nutty", "Malty", "Fruity", "Floral",
]
EXPECTED = {
    "Oban": ("Cluster 3", ["Balblair", "Isle of Jura", "Glenmorangie"], 2.6342429825492006),
    "Lagavulin": ("Cluster 4", ["Laphroig", "Clynelish", "Caol Ila"], 2.537315990058271),
}


def load_rows():
    with CSV_PATH.open(newline="", encoding="utf-8-sig") as source:
        rows = list(csv.DictReader(source))
    if len(rows) != 86:
        raise AssertionError(f"Expected 86 distilleries, found {len(rows)}")
    for row in rows:
        for feature in FEATURES:
            row[feature] = float(row[feature])
    return rows


def distances(rows, selected):
    means = [sum(row[feature] for row in rows) / len(rows) for feature in FEATURES]
    scales = []
    for feature, mean in zip(FEATURES, means):
        variance = sum((row[feature] - mean) ** 2 for row in rows) / len(rows)
        scales.append(math.sqrt(variance) or 1.0)

    def distance(candidate):
        return math.sqrt(sum(
            (((candidate[feature] - mean) / scale)
             - ((selected[feature] - mean) / scale)) ** 2
            for feature, mean, scale in zip(FEATURES, means, scales)
        ))

    return distance


def main():
    rows = load_rows()
    counts = {}
    for row in rows:
        counts[row["Cluster"]] = counts.get(row["Cluster"], 0) + 1
    assert counts == {"Cluster 1": 33, "Cluster 2": 32, "Cluster 3": 15, "Cluster 4": 6}, counts

    for selected_name, (expected_cluster, expected_recommendations, expected_distance) in EXPECTED.items():
        selected = next(row for row in rows if row["Distillery"] == selected_name)
        assert selected["Cluster"] == expected_cluster
        distance = distances(rows, selected)
        eligible = [
            row for row in rows
            if row["Distillery"] != selected_name and row["Cluster"] == selected["Cluster"]
        ]
        ranked = sorted(((distance(row), row["Distillery"]) for row in eligible), key=lambda item: (item[0], item[1]))
        nearest_distance, nearest_name = ranked[0]
        assert nearest_name != selected_name
        recommendation_names = [name for _, name in ranked[:3]]
        assert selected_name not in recommendation_names
        assert all(next(row for row in rows if row["Distillery"] == name)["Cluster"] == selected["Cluster"] for name in recommendation_names)
        assert recommendation_names == expected_recommendations, (selected_name, recommendation_names)
        assert math.isclose(nearest_distance, expected_distance, rel_tol=0, abs_tol=1e-12)
        tie_names = [name for value, name in ranked if math.isclose(value, nearest_distance, rel_tol=0, abs_tol=1e-12)]
        assert tie_names == [recommendation_names[0]], (selected_name, tie_names)
        assert len(ranked[:3]) == min(3, len(eligible))
        print(f"{selected_name}: {expected_cluster} -> {recommendation_names}; nearest distance {nearest_distance:.12f}; nearest tie: unique")

    print(f"PASS: {len(rows)} rows, accepted cluster counts, recommendation names and distances.")


if __name__ == "__main__":
    main()
