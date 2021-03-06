/* vim: set ft=javascript ts=2 et sw=2 tw=80: */
/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

// Tests that the checkbox to include browser styles works properly.

let doc;
let inspector;
let computedView;

function createDocument()
{
  doc.body.innerHTML = '<style type="text/css"> ' +
    '.matches {color: #F00;}</style>' +
    '<span id="matches" class="matches">Some styled text</span>' +
    '</div>';
  doc.title = "Style Inspector Default Styles Test";

  openComputedView(SI_inspectNode);
}

function SI_inspectNode(aInspector, aComputedView)
{
  inspector = aInspector;
  computedView = aComputedView;

  let span = doc.querySelector("#matches");
  ok(span, "captain, we have the matches span");

  inspector.selection.setNode(span);
  inspector.once("inspector-updated", () => {
    is(span, computedView.viewedElement.rawNode(),
      "style inspector node matches the selected node");
    SI_check();
  });
}

function SI_check()
{
  is(propertyVisible("color"), true,
    "span #matches color property is visible");
  is(propertyVisible("background-color"), false,
    "span #matches background-color property is hidden");

  SI_toggleDefaultStyles();
}

function SI_toggleDefaultStyles()
{
  // Click on the checkbox.
  let doc = computedView.styleDocument;
  let checkbox = doc.querySelector(".includebrowserstyles");
  inspector.once("computed-view-refreshed", SI_checkDefaultStyles);

  checkbox.click();
}

function SI_checkDefaultStyles()
{
  // Check that the default styles are now applied.
  is(propertyVisible("color"), true,
      "span color property is visible");
  is(propertyVisible("background-color"), true,
      "span background-color property is visible");

  finishUp();
}

function propertyVisible(aName)
{
  info("Checking property visibility for " + aName);
  let propertyViews = computedView.propertyViews;
  for each (let propView in propertyViews) {
    if (propView.name == aName) {
      return propView.visible;
    }
  }
  return false;
}

function finishUp()
{
  doc = inspector = computedView = null;
  gBrowser.removeCurrentTab();
  finish();
}

function test()
{
  waitForExplicitFinish();
  gBrowser.selectedTab = gBrowser.addTab();
  gBrowser.selectedBrowser.addEventListener("load", function onLoad(evt) {
    gBrowser.selectedBrowser.removeEventListener(evt.type, onLoad, true);
    doc = content.document;
    waitForFocus(createDocument, content);
  }, true);

  content.location = "data:text/html,default styles test";
}
