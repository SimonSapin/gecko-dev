package org.mozilla.gecko.tests;

import org.mozilla.gecko.*;
import org.mozilla.gecko.tests.helpers.JavascriptMessageParser;

import android.util.Log;

import org.json.JSONObject;


public class JavascriptTest extends BaseTest {
    private static final String LOGTAG = "JavascriptTest";
    private static final String EVENT_TYPE = "Robocop:JS";

    private final String javascriptUrl;

    public JavascriptTest(String javascriptUrl) {
        super();
        this.javascriptUrl = javascriptUrl;
    }

    @Override
    protected int getTestType() {
        return TEST_MOCHITEST;
    }

    public void testJavascript() throws Exception {
        blockForGeckoReady();

        // We want to be waiting for Robocop messages before the page is loaded
        // because the test harness runs each test in the suite (and possibly
        // completes testing) before the page load event is fired.
        final Actions.EventExpecter expecter =
            mActions.expectGeckoEvent(EVENT_TYPE);
        mAsserter.dumpLog("Registered listener for " + EVENT_TYPE);

        final String url = getAbsoluteUrl(StringHelper.ROBOCOP_JS_HARNESS_URL +
                                          "?path=" + javascriptUrl);
        mAsserter.dumpLog("Loading JavaScript test from " + url);
        loadUrl(url);

        final JavascriptMessageParser testMessageParser = new JavascriptMessageParser(mAsserter);
        try {
            while (!testMessageParser.isTestFinished()) {
                if (Log.isLoggable(LOGTAG, Log.VERBOSE)) {
                    Log.v(LOGTAG, "Waiting for " + EVENT_TYPE);
                }
                String data = expecter.blockForEventData();
                if (Log.isLoggable(LOGTAG, Log.VERBOSE)) {
                    Log.v(LOGTAG, "Got event with data '" + data + "'");
                }

                JSONObject o = new JSONObject(data);
                String innerType = o.getString("innerType");
                if (!"progress".equals(innerType)) {
                    throw new Exception("Unexpected event innerType " + innerType);
                }

                String message = o.getString("message");
                if (message == null) {
                    throw new Exception("Progress message must not be null");
                }
                testMessageParser.logMessage(message);
            }

            if (Log.isLoggable(LOGTAG, Log.DEBUG)) {
                Log.d(LOGTAG, "Got test finished message");
            }
        } finally {
            expecter.unregisterListener();
            mAsserter.dumpLog("Unregistered listener for " + EVENT_TYPE);
        }
    }
}
