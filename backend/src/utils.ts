const BSON = new (require('bson-buffer'))();
import { Server as WebSocketServer } from 'ws';
import * as Joi from 'joi';
import WebSocket = require('ws');

export function ApplicationArgs(...more: any) {
    return Joi.array().required().ordered(
        ...arguments
    );
}

export class WebSocketRpcWrapper {
    constructor(private rpc: any, wss: WebSocketServer) {
        wss.on('connection', (ws) => {
            const connectionId = rpc.open();

            ws.on('message', async (message) => {
                const data = BSON.deserialize(message);

                if (data.op) {
                    if (rpc.modules[data.op] && typeof rpc.modules[data.op].validate === 'function') {
                        const schema: Joi.AnySchema = await rpc.modules[data.op].validate(data.args, {});

                        const result = schema.validate(data.args);

                        if (result.error) {
                            try {
                                const message = {
                                    err: data.id,
                                    data: {
                                        msg: 'Validation error',
                                        code: 191,
                                        req: { op: data.op, args: data.args },
                                        debug: result.error.details
                                    }
                                };
                                const response = BSON.serialize(message);
                                console.log(data.op, data.args, 'validation error', result.error, response);
                                return ws.send(response);
                            } catch (err) {
                                console.log('Failed sending response:', err, 'sending:', message);
                            }
                        }

                        this.parse(data.op, data.args, data.id, connectionId, ws);
                        return;
                    }

                    this.parse(data.op, data.args, data.id, connectionId, ws);
                }
            });

            ws.on('close', () => {
                rpc.close(connectionId);
            });
        });
    }

    /**
     * Parse incoming message
     */
    parse(op: string, args: any[], id: number, connectionId: number, ws: WebSocket) {
        this.rpc.parse({
            id,
            op,
            args
        },
        (msg: Buffer) => {
            try {
                ws.send(BSON.serialize(msg));
            } catch (err) {
                console.log('Gracefully catching WebSocket sending error:', err.stack, 'while sending:', op, args, msg);
            }
        },
        { /* context */ },
        connectionId);
    }
}

export function btoh(buffer) {
    return Array
        .from(new Uint8Array(buffer))
        .map(b => ('0' + b.toString(16)).slice(-2))
        .join('');
}

export function mimeFromFile({ type, name }: { type: string, name: string }) {
    if (name.endsWith('.mkv')) {
        return 'video/x-matroska';
    }

    return type;
}

