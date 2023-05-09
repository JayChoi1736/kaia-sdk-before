package opensdk.sdk.apis.klay.filter;

import opensdk.sdk.apis.constant.UrlConstants;
import opensdk.sdk.models.KlayGetFilterChangesResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.klaytn.OpenSDK;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

@DisplayName("Klay RPC Test")
public class KlayGetFilterChangesTest {
    private final OpenSDK sdk = new OpenSDK(UrlConstants.TEST_URL);

    @Test
    @DisplayName("RPC klay_getFilterChange")
    void whenRequestValid_ThenCall200ResponseReturns() throws IOException {
        KlayGetFilterChangesResponse response = sdk.klay.getFilterChanges("0x1aa7b9746d4192e90fb0acd89c514375").send();

        assertNotNull(response);
        assertNull(response.getError());
    }
}
