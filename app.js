(() => {
  "use strict";

  const FEATURES = [
    "Body", "Sweetness", "Smoky", "Medicinal", "Tobacco", "Honey",
    "Spicy", "Winey", "Nutty", "Malty", "Fruity", "Floral"
  ];
  const MAX_SCORE = 4;
  const PROFILE_COPY = {
    "Cluster 1": {
      title: "Bright and floral",
      note: "A lighter-bodied profile with brighter fruity and floral scores."
    },
    "Cluster 2": {
      title: "Round and honeyed",
      note: "A rounded profile with higher honey, malt and sweet scores."
    },
    "Cluster 3": {
      title: "Softly smoky",
      note: "Gentle smoky and medicinal notes sit alongside a balanced flavour profile."
    },
    "Cluster 4": {
      title: "Boldly smoky",
      note: "Fuller-bodied, with much stronger smoky and medicinal scores."
    }
  };

  const form = document.getElementById("whisky-form");
  const select = document.getElementById("whisky-select");
  const findButton = document.getElementById("find-button");
  const status = document.getElementById("data-status");
  const results = document.getElementById("results");
  const emptyState = document.getElementById("empty-state");
  const resultsContent = document.getElementById("results-content");
  let whiskies = [];
  let standardisation = [];

  function parseCSV(text) {
    const rows = [];
    let row = [];
    let value = "";
    let quoted = false;

    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      if (quoted) {
        if (char === '"' && text[i + 1] === '"') {
          value += '"';
          i += 1;
        } else if (char === '"') {
          quoted = false;
        } else {
          value += char;
        }
      } else if (char === '"' && value.length === 0) {
        quoted = true;
      } else if (char === ",") {
        row.push(value);
        value = "";
      } else if (char === "\n" || char === "\r") {
        if (char === "\r" && text[i + 1] === "\n") i += 1;
        row.push(value);
        if (row.some((cell) => cell !== "")) rows.push(row);
        row = [];
        value = "";
      } else {
        value += char;
      }
    }
    if (value !== "" || row.length > 0) {
      row.push(value);
      if (row.some((cell) => cell !== "")) rows.push(row);
    }
    if (quoted) throw new Error("The whisky CSV has an unfinished quoted field.");
    if (rows.length < 2) throw new Error("The whisky CSV contains no whisky rows.");

    const headers = rows[0].map((header) => header.trim());
    return rows.slice(1).map((cells, rowIndex) => {
      if (cells.length !== headers.length) {
        throw new Error(`CSV row ${rowIndex + 2} has a different number of fields.`);
      }
      const record = {};
      headers.forEach((header, index) => { record[header] = cells[index]; });
      FEATURES.forEach((feature) => {
        record[feature] = Number(record[feature]);
        if (!Number.isFinite(record[feature])) {
          throw new Error(`A flavour score is missing or invalid in row ${rowIndex + 2}.`);
        }
      });
      if (!record.Distillery || !record.Cluster || !PROFILE_COPY[record.Cluster]) {
        throw new Error(`A distillery name or accepted cluster label is missing in row ${rowIndex + 2}.`);
      }
      return record;
    });
  }

  function calculateStandardisation(rows) {
    return FEATURES.map((feature) => {
      const mean = rows.reduce((sum, row) => sum + row[feature], 0) / rows.length;
      const variance = rows.reduce((sum, row) => sum + ((row[feature] - mean) ** 2), 0) / rows.length;
      const standardDeviation = Math.sqrt(variance);
      return { feature, mean, scale: standardDeviation || 1 };
    });
  }

  function distanceBetween(first, second) {
    const squaredDifferences = standardisation.map(({ feature, mean, scale }) => {
      const firstScaled = (first[feature] - mean) / scale;
      const secondScaled = (second[feature] - mean) / scale;
      return (firstScaled - secondScaled) ** 2;
    });
    return Math.sqrt(squaredDifferences.reduce((sum, value) => sum + value, 0));
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function profileFor(row) {
    return PROFILE_COPY[row.Cluster];
  }

  function exactMatches(selected, candidate) {
    return FEATURES.filter((feature) => selected[feature] === candidate[feature]);
  }

  function explanationFor(selected, candidate) {
    const matches = exactMatches(selected, candidate);
    if (matches.length === FEATURES.length) {
      return "All twelve recorded flavour scores match exactly.";
    }
    const closeness = matches.length === 0
      ? "Their scores are closest overall across all twelve characteristics."
      : `They share ${matches.length} of 12 recorded scores, including ${matches.slice(0, 3).join(", ")}.`;
    return `${closeness} Similar recorded flavours make this a useful place to explore; they do not guarantee you will enjoy it.`;
  }

  function buildComparison(selected, candidate) {
    const details = element("details", "match-details");
    details.open = false;
    const summary = element("summary", "", "Compare all twelve flavour scores");
    details.append(summary);

    const content = element("div", "compare-content");
    const legend = element("div", "score-legend");
    legend.setAttribute("aria-label", "Chart legend; scores range from zero to four.");
    const selectedKey = element("span", "legend-key");
    selectedKey.append(element("span", "legend-dot"), element("span", "", selected.Distillery));
    const matchKey = element("span", "legend-key");
    matchKey.append(element("span", "legend-dot match"), element("span", "", candidate.Distillery));
    legend.append(selectedKey, matchKey, element("span", "scale-hint", "Recorded score · 0 to 4"));
    content.append(legend);

    const rows = element("div", "flavour-rows");
    FEATURES.forEach((feature) => {
      const row = element("div", "score-row");
      const head = element("div", "score-head");
      head.append(element("strong", "", feature));
      const values = element("span", "score-pair");
      values.append(
        element("span", "pick-number", String(selected[feature])),
        document.createTextNode("  /  "),
        element("span", "match-number", String(candidate[feature]))
      );
      head.append(values);
      row.append(head);

      const tracks = element("div", "score-tracks");
      [[selected[feature], "pick", selected.Distillery], [candidate[feature], "match", candidate.Distillery]].forEach(([score, kind, name]) => {
        const track = element("div", "score-track");
        track.setAttribute("role", "img");
        track.setAttribute("aria-label", `${name}: ${feature} score ${score} out of ${MAX_SCORE}`);
        const fill = element("span", `score-fill ${kind}`);
        fill.style.width = `${Math.max(0, Math.min(MAX_SCORE, score)) / MAX_SCORE * 100}%`;
        track.append(fill);
        tracks.append(track);
      });
      row.append(tracks);
      rows.append(row);
    });
    content.append(rows);
    details.append(content);
    return details;
  }

  function renderRecommendations(selected) {
    const candidates = whiskies
      .filter((row) => row !== selected && row.Cluster === selected.Cluster)
      .map((row) => ({ row, distance: distanceBetween(selected, row) }))
      .sort((a, b) => a.distance - b.distance || a.row.Distillery.localeCompare(b.row.Distillery))
      .slice(0, 3);

    resultsContent.replaceChildren();
    emptyState.hidden = true;
    resultsContent.hidden = false;
    results.setAttribute("aria-busy", "false");

    const profile = profileFor(selected);
    const intro = element("div", "results-intro");
    const introCopy = element("div", "");
    introCopy.append(
      element("p", "eyebrow", "YOUR FLAVOUR NEIGHBOURHOOD"),
      element("h2", "", `Starting with ${selected.Distillery}`),
      element("p", "", profile.note)
    );
    const badge = element("div", "results-badge");
    badge.append(element("strong", "", profile.title), document.createTextNode("A plain-language description of this flavour group."));
    intro.append(introCopy, badge);
    resultsContent.append(intro);

    if (candidates.length === 0) {
      resultsContent.append(element("p", "no-results", "There are no other whiskies in this flavour group to compare with this one."));
      return;
    }

    const grid = element("div", "matches-grid");
    candidates.forEach(({ row: candidate }, index) => {
      const card = element("article", "match-card");
      const heading = element("div", "match-heading");
      heading.append(element("span", "match-rank", String(index + 1)));
      const headingCopy = element("div", "");
      headingCopy.append(
        element("h3", "", candidate.Distillery),
        element("p", "", index === 0 ? "Closest recorded flavour profile" : "Another close flavour profile")
      );
      const pill = element("span", "profile-pill", profile.title);
      heading.append(headingCopy, pill);
      card.append(heading);

      const reason = element("p", "match-reason");
      const reasonLead = element("strong", "", "Why it appears here: ");
      reason.append(reasonLead, document.createTextNode(explanationFor(selected, candidate)));
      card.append(reason, buildComparison(selected, candidate));
      if (index === 0) card.querySelector("details").open = true;
      grid.append(card);
    });
    resultsContent.append(grid);

    const actions = element("div", "results-actions");
    const reset = element("button", "small-tartan", "Choose another whisky");
    reset.type = "button";
    reset.addEventListener("click", () => {
      select.value = "";
      resultsContent.hidden = true;
      emptyState.hidden = false;
      select.focus();
      results.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    actions.append(reset);
    resultsContent.append(actions);
  }

  async function start() {
    try {
      const response = await fetch("./whisky_with_clusters.csv", { cache: "no-store" });
      if (!response.ok) throw new Error(`Could not load the whisky list (HTTP ${response.status}).`);
      whiskies = parseCSV(await response.text());
      standardisation = calculateStandardisation(whiskies);
      whiskies.sort((a, b) => a.Distillery.localeCompare(b.Distillery));

      const placeholder = element("option", "", "Choose a whisky…");
      placeholder.value = "";
      select.replaceChildren(placeholder);
      whiskies.forEach((whisky, index) => {
        const option = element("option", "", whisky.Distillery);
        option.value = String(index);
        select.append(option);
      });
      select.disabled = false;
      findButton.disabled = false;
      status.textContent = `${whiskies.length} distilleries loaded · choose a name to begin.`;
      results.setAttribute("aria-busy", "false");

      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const selected = whiskies[Number(select.value)];
        if (!selected) return;
        renderRecommendations(selected);
        results.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (error) {
      status.textContent = "The whisky list could not be loaded.";
      select.replaceChildren(element("option", "", "Whisky list unavailable"));
      select.disabled = true;
      findButton.disabled = true;
      emptyState.replaceChildren(
        element("p", "eyebrow", "A QUICK SET-UP CHECK"),
        element("h2", "", "The whisky list did not load."),
        element("p", "", "Open this page through the local preview instructions in README.md so the browser can read its nearby CSV file.")
      );
      console.error(error);
    }
  }

  start();
})();
