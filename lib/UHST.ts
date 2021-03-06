import { UhstApiClient } from "./contracts/UhstApiClient";
import { ApiClient } from "./ApiClient";
import { UhstSocket } from "./UhstSocket";
import { UhstHost } from "./UhstHost";

export interface UhstOptions {
    /**
     * Used when instantiating the underlying WebRTC connection.
     * Most importantly allows specifying iceServers for NAT
     * traversal.
     */
    rtcConfiguration?: RTCConfiguration,
    /**
     * An API client for communication with the signalling server,
     * normally used for testing or if implementing 
     * [[UhstApiClient | custom signalling protocol]].
     * If both [[meetingPointClient]] and [[meetingPointUrl]] are
     * defined, then [[meetingPointClient]] will be used.
     */
    meetingPointClient?: UhstApiClient,
    /**
     * Url to a server implementing the UHST signalling protocol.
     * If not defined and [[meetingPointClient]] is also not defined, then
     * this library will fallback to [[DEFAULT_MEETING_POINT_URL | a default signalling server URL]].
     */
    meetingPointUrl?: string,
    /**
     * Set to true and subscribe to "diagnostic" to receive events
     * from [[UhstSocket]].
     */
    debug?: boolean
}

export class UHST {
    /**
    * Fallback URL to a UHST meeting point (signalling server). If no
    * configuration is provided or [[meetingPointUrl]] is not defined in
    * the configuration then this URL will be used.
    */
    private static DEFAULT_MEETING_POINT_URL = "https://demo.uhst.io/";
    private rtcConfiguration: RTCConfiguration;
    private apiClient: UhstApiClient;
    private debug: boolean;

    constructor(options: UhstOptions = {}) {
        this.debug = options.debug ?? false;
        this.rtcConfiguration = options.rtcConfiguration ?? { iceServers: [{ urls: "stun:stun.l.google.com:19302" }, {urls: "stun:global.stun.twilio.com:3478"}] };
        if (options.meetingPointClient) {
            this.apiClient = options.meetingPointClient;
        } else if (options.meetingPointUrl) {
            this.apiClient = new ApiClient(options.meetingPointUrl);
        } else {
            this.apiClient = new ApiClient(UHST.DEFAULT_MEETING_POINT_URL);
        }
    }

    join(hostId: string): UhstSocket {
        return new UhstSocket(this.apiClient, this.rtcConfiguration, {type: "client", hostId}, this.debug);
    }

    host(hostId: string): UhstHost {
        return new UhstHost(this.apiClient, this.rtcConfiguration, hostId, this.debug);
    }

}