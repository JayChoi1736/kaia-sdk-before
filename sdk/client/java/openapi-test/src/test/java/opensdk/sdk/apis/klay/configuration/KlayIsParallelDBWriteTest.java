package opensdk.sdk.apis.klay.configuration;

import opensdk.sdk.apis.constant.UrlConstants;
import opensdk.sdk.models.KlayIsParallelDBWriteResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.klaytn.OpenSDK;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;


@DisplayName("Klay RPC Test")
public class KlayIsParallelDBWriteTest {
    private final OpenSDK sdk = new OpenSDK(UrlConstants.SERVER_URL);
    @Test
    @DisplayName("RPC klay_isParallelDbWrite")
    void whenRequestValid_ThenCall200ResponseReturns() throws IOException {
        KlayIsParallelDBWriteResponse response = sdk.klay.isParallelDBWrite().send();

        assertNotNull(response);
        assertNull(response.getError());
    }
}
