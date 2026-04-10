// ==UserScript==
// @name          wbs-report-portfolio-de-monkey-fier
// @match         *://ecampus.wbstraining.de/*
// @run-at        document-end
// @version       1.0
// @icon          https://ecampus.wbstraining.de/Customizing/global/skin/wbs718skin/images/HeaderIconResponsive.svg
// ==/UserScript==

(() => {
    ////////////////////////////// START config
    // Autofill templates that can be toggled on and off for comments:
    const commentTemplates = [
        "Montag:",
        "Dienstag:",
        "Mittwoch:",
        "Donnerstag:",
        "Freitag:",
        "Bitte 3-stellige Wochennr. (00X) setzen.",
        "Bitte Abschnitt benennen.",
        "Bitte min. 3 Einträge á Tag.",
        "FPAs bitte etwas ausführen.",
        "Bitte ganze Tage oder 0 St/UE eintragen.",
        "Für entschuldigte Tage bitte 0 St/UE eintragen.",
        "Bitte keine Einträge am Wochenende.",
        "Danke :)",
    ];

    // Strings to look for in the portfolio (partial, case-insensitive):
    const commentPOIs = [
        "krank",
        "entschuldig", //t, ung
        "abwesen", //d, heit
        "anwesen", //d, heit
        "arzt",
        "fehl",
        "attest",
        "urlaub",
        "ferien",
        "feiertag",
        "fpa",
        "prüfung",
        "test",
        "kontrolle",
    ];
    ////////////////////////////// END config


    // eCampus uses query params instead of a RESTful path ...
    const params = new URLSearchParams(location.search);
    let isParamPath = (value) => params.get("cmd") === value || params.get("fallbackCmd") === value;

    let testCodeActive = false;
    let doTest = (f) => {
        testCodeActive = true;
        f();
    };

    // report portfolio filter page
    if (isParamPath("reportstrainer.list")) {
        // auto filter
        const wantedFilterOption = 3;
        const filterDropdown = document.querySelector("select#status");
        const filterButton = document.querySelector("#tfil_rstg_ > fieldset > span > input:nth-child(1)");
        if (filterDropdown.selectedIndex === 0) {
            filterDropdown.selectedIndex = wantedFilterOption;
            filterButton.click();
            return;
        }

        // table
        let viewPos = 1;
        let acceptPos = 2;
        let rejectPos = 4;

        let getAllLinkTextsAtPopupPosition = (position) => `tbody > tr > .std:nth-child(7) > .btn-group > #ilAdvSelListTable_asl_ > li:nth-child(${position}) > a`;
        let getSelectorForRow = (row) => `tbody > tr:nth-child(${row}) > .std:nth-child(7) > .btn-group > #ilAdvSelListTable_asl_ > li:nth-child(${viewPos}) > a`;

        // block accidential actions
        document.querySelectorAll(`${getAllLinkTextsAtPopupPosition(acceptPos)}, ${getAllLinkTextsAtPopupPosition(rejectPos)}`).forEach(a => {
            a.href = "javascript:void(0)";
            a.style.textDecoration = "line-through";
            a.title = "Hier wurde für Dich ein Aus-Versehen-Klick deaktiviert 💚"
        });

        // automated opening
        let nextRow = 1;
        let rowIfExists = (row) => {
            const e = document.querySelector(getSelectorForRow(nextRow));
            if (!e) alert("Alle Zeilen auf dieser Seite wurden bearbeitet! \nReaload tut gut 😉");
            return e;
        };
        let openNextRowNewTabButton = undefined;
        let openNextRowNewTabButtonTitle = "⤴️";
        let openNextRowNewTab = () => {
            const rowElement = rowIfExists(nextRow);
            if (!rowElement) return;
            const nextUrl = rowElement.href;
            nextRow++;
            openNextRowNewTabButton.value = `${openNextRowNewTabButtonTitle} (${nextRow})`;
            window.open(nextUrl, '_blank');
        };

        let openNextRowHereButtonTitle = "▶️";
        let openNextRowHere = () => {
            const rowElement = rowIfExists(nextRow);
            if (!rowElement) return;
            const nextUrl = rowElement.href;
            window.open(nextUrl, '_self');
        };

        let bar = document.querySelector("#tfil_rstg_ > fieldset > span");
        let insertButton = (title, onclickFunction, tooltip = "") => {
            const button = document.createElement('input');
            button.type = "button";
            button.value = title;
            button.title = tooltip
            button.className = "btn btn-default";
            button.style.marginLeft = "4px";
            button.addEventListener("click", onclickFunction);
            bar.appendChild(button);
            return button;
        };

        // appending
        insertButton(openNextRowHereButtonTitle, openNextRowHere, "Nächstes Berichtsheft in diesem Fenster öffnen");
        openNextRowNewTabButton = insertButton(openNextRowNewTabButtonTitle, openNextRowNewTab, "Nächstes Berichtsheft in neuem Tab öffnen");
        if (filterDropdown.selectedIndex != wantedFilterOption) {
            const warning = document.createElement('span');
            warning.innerHTML = "⚠️";
            warning.style.marginLeft = "3px";
            warning.title = "Du bist nicht bei den 'Eingereicht'en Berichtsheften. Ich hoffe Du weißt, was Du tust.";
            bar.appendChild(warning);
        }
    }

    // single report portfolio page
    if (isParamPath("reportstrainer.viewreport")) {
        document.querySelectorAll('input[name="cmd[reportstrainer.saveaccept]"]').forEach(button => button.value = "✅ Annehmen");
        document.querySelectorAll('input[name="cmd[reportstrainer.savereject]"]').forEach(button => button.value = "👎 Zurückgeben");

        // comment templates
        const fakeForm = document.createElement('form');
        const commentTextArea = document.querySelector("#remarks");
        const commentTemplatesElement = commentTextArea.parentNode.parentNode.parentNode;

        let toggleComment = (text) => {
            let isIncluded = commentTextArea.value.includes(text);
            if (isIncluded) commentTextArea.value = commentTextArea.value.replace(text, "").replace("  ", " ").trim();
            else commentTextArea.value = (commentTextArea.value.trim() + " " + text).trim();
        };

        const bottomButtons = document.querySelector("#form_ > div > div.ilFormFooter.clearfix");
        let insertLink = (emoji, content, onclickFunction) => {
            const group = document.createElement('div');
            group.classList.add("form-group");
                const head = document.createElement('div');
                head.classList.add("col-sm-3");
                head.classList.add("control-label");
                group.appendChild(head);
                const tail = document.createElement('div');
                tail.classList.add("col-sm-9");
                    const box = document.createElement('div');
                    box.classList.add("checkbox");
                        const icon = document.createElement('span');
                        icon.style.paddingTop = '2px';
                        icon.innerHTML = emoji + " ";
                        box.appendChild(icon);
                        const link = document.createElement('a');
                        link.style.paddingTop = '2px';
                        link.innerHTML = content;
                        link.addEventListener("click", onclickFunction);
                        box.appendChild(link);
                    tail.appendChild(box);
                group.appendChild(tail);
            commentTemplatesElement.insertBefore(group, bottomButtons);
        };

        let clearComments = () => commentTextArea.value = "";

        insertLink("❌", "*Leere*", clearComments);
        for (let i = 0; i < commentTemplates.length; i++) {
            const value = commentTemplates[i];
            insertLink("💬", value, ()=>toggleComment(value));
        }

        // disclaimer
        const disclaimer = document.createElement('p');
        disclaimer.innerHTML = "Liebe*r Ausbilder*in, der WBS Berichtsheft de-monkey-fier ist nur ein Werkzeug. Bitte überprüfe das Berichtsheft und Dein Kommentar immer manuell, danke.";
        disclaimer.style.fontStyle = "italic";
        commentTemplatesElement.insertBefore(disclaimer, bottomButtons);

        // validations
        let hasAnyWarnings = false;
        let hasAnyPOIs = false;

        // pois
        const poiInputs = document.querySelectorAll('input[name*="_text"]');
        for (let i = 0; i < poiInputs.length; i++) {
            const poiInput = poiInputs[i];
            //doTest(()=>{if (i == 24) poiInput.value = commentPOIs[0];}); // TESTING
            for (let p = 0; p < commentPOIs.length; p++) {
                const poi = commentPOIs[p];
                if (poiInput.value.toLowerCase().includes(poi.toLowerCase())) {
                    const poiLabel = document.querySelector(`[for="${poiInput.getAttribute("id")}"]`);
                    if (!poiLabel.innerHTML.includes("🔎")) poiLabel.innerHTML += " 🔎";
                    poiLabel.title = poiInput.title += `🔎 Enthält "${poi}" `;
                    hasAnyPOIs = true;
                }
            }
        }

        // week number
        const weekNumberInput = document.querySelector('input[aria-label="Berichtsnummer"]');
        //doTest(()=>weekNumberInput.value = '1'); // TESTING
        if (weekNumberInput.value.length != 3) {
            const weekNumberLabel = document.querySelector('[for="number"]');
            weekNumberLabel.innerHTML += " ⚠️";
            weekNumberLabel.title = weekNumberInput.title += "⚠️ Nicht dreistellig (00X). ";
            hasAnyWarnings = true;
        }

        // times
        let accTimes = 0;
        const ueInputs = document.querySelectorAll('input[aria-label="Stunden / UE"]');
        for (let i = 0; i < ueInputs.length; i++) {
            const ueInput = ueInputs[i];
            //doTest(()=>{if (i == 6) ueInput.value = ' 9eu';}); // TESTING
            const number = parseInt(ueInput.value);
            accTimes += number;
            if (number != 0 && number != 8 && number != 10) {
                const ueLabel = document.querySelector(`[for="${ueInput.getAttribute("id")}"]`);
                ueLabel.innerHTML += " ⚠️";
                ueLabel.title = ueInput.title += "⚠️ St/UE sind nicht 0, 8 oder 10. ";
                hasAnyWarnings = true;
            }
        }

        // total time
        const totalUEInput = document.querySelector("#total_hours");
        const totalUELabel = document.querySelector("#il_prop_cont_total_hours > label");
        //doTest(()=>totalUEInput.value = 23); // TESTING
        const totalNumber = parseInt(totalUEInput.value);
        if (totalNumber % 8 != 0 && totalNumber % 10 != 0) {
            totalUELabel.innerHTML += " ⚠️";
            totalUELabel.title = totalUEInput.title += "⚠️ St/UE sind nicht 0, und nicht durch 8 oder 10 teilbar. ";
            hasAnyWarnings = true;
        }
        if (totalNumber != accTimes) {
            totalUELabel.innerHTML += " ⚠️";
            totalUELabel.title = totalUEInput.title += "⚠️ St/UE Summe stimmt nicht überein. ";
            hasAnyWarnings = true;
        }

        // warnings
        if (hasAnyWarnings || hasAnyPOIs) {
            const bottomButtonsContainer = document.querySelector("#form_ > div > div.ilFormFooter.clearfix > div.col-sm-6.ilFormCmds");
            const firstBottomButton = document.querySelector("#form_ > div > div.ilFormFooter.clearfix > div.col-sm-6.ilFormCmds > input:nth-child(1)");
            const someWarnings = document.createElement('span');
            const symbols = (hasAnyWarnings ? "⚠️" : "") + (hasAnyPOIs ? "🔎" : "");
            someWarnings.innerHTML = symbols + " ";
            someWarnings.title = `Siehe ${symbols}: There's something strange 👻 in the neighborhood!`;
            bottomButtonsContainer.insertBefore(someWarnings, firstBottomButton);
        }
    }

    // testing
    if (testCodeActive) alert("🚨 TEST CODE ACTIVE 🚨");
})();