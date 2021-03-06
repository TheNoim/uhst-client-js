import { UhstApiClient, MessageHandler } from "./contracts/UhstApiClient";
import { ClientConfiguration, HostConfiguration, Message } from "./models";
import { InvalidToken, InvalidHostId, HostIdAlreadyInUse, MeetingPointError, MeetingPointUnreachable, InvalidClientOrHostId } from "./UhstErrors";

const REQUEST_OPTIONS = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    }
};

export class ApiClient implements UhstApiClient {
    constructor(private apiUrl: string) {

    }

    async initHost(hostId: string): Promise<HostConfiguration> {
        let response: Response;
        try {
            response = await fetch(`${this.apiUrl}?action=host&hostId=${hostId}`, REQUEST_OPTIONS);
        } catch (error) {
            console.log(error);
            throw new MeetingPointUnreachable(error);
        }
        if (response.status == 200) {
            const jsonResponse = await response.json();
            return jsonResponse;
        } else if (response.status == 400) {
            throw new HostIdAlreadyInUse(response.statusText);
        } else {
            throw new MeetingPointError(`${response.status} ${response.statusText}`);
        }
    }

    async initClient(hostId: string): Promise<ClientConfiguration> {
        let response: Response;
        try {
            response = await fetch(`${this.apiUrl}?action=join&hostId=${hostId}`, REQUEST_OPTIONS);
        } catch (error) {
            console.log(error);
            throw new MeetingPointUnreachable(error);
        }
        if (response.status == 200) {
            const jsonResponse = await response.json();
            return jsonResponse;
        } else if (response.status == 400) {
            throw new InvalidHostId(response.statusText);
        } else {
            throw new MeetingPointError(`${response.status} ${response.statusText}`);
        }
    }

    async sendMessage(token: string, message: any, sendUrl?: string): Promise<void> {
        const url = sendUrl ?? this.apiUrl;
        let response: Response;
        try {
            response = await fetch(`${url}?token=${token}`, {
                ...REQUEST_OPTIONS,
                body: JSON.stringify(message),
            });
        } catch (error) {
            console.log(error);
            throw new MeetingPointUnreachable(error);
        }
        if (response.status == 200) {
            return;
        } else if (response.status == 400) {
            throw new InvalidClientOrHostId(response.statusText);
        } else if (response.status == 401) {
            throw new InvalidToken(response.statusText);
        } else {
            throw new MeetingPointError(`${response.status} ${response.statusText}`);
        }
    }

    subscribeToMessages(token: string, handler: MessageHandler, receiveUrl?: string): EventSource {
        try {
        const url = receiveUrl ?? this.apiUrl;
        const stream = new EventSource(`${url}?token=${token}`);
        stream.onerror = (ev: Event) => {
            throw new MeetingPointError("EventSource failed.");
        };
        stream.addEventListener("message", (evt: MessageEvent) => {
            const message: Message = JSON.parse(evt.data);
            handler(message);
        });
        return stream;
    } catch (error) {
        console.log(error);
        throw new MeetingPointError(error);
    }
    }

}