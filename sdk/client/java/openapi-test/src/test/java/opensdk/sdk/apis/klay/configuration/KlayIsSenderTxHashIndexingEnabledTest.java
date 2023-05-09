package opensdk.sdk.apis.klay.configuration;

import opensdk.sdk.apis.constant.UrlConstants;
import opensdk.sdk.models.KlayIsSenderTxHashIndexingEnabledResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.klaytn.OpenSDK;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;


public class KlayIsSenderTxHashIndexingEnabledTest {
    private final OpenSDK sdk = new OpenSDK(UrlConstants.TEST_URL);
    @Test
    @DisplayName("RPC klay_isSenderTxHashIndexingEnabled")
    void whenRequestValid_ThenCall200ResponseReturns() throws IOException {
        KlayIsSenderTxHashIndexingEnabledResponse response = sdk.klay.isSenderTxHashIndexingEnabled().send();

        assertNotNull(response);
        assertNull(response.getError());
    }
}
