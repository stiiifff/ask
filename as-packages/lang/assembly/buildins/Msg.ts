/**
 * All Rights Reserved by Patract Labs.
 * @author liangqin.fan@gmail.com
 */

import { u128 } from "as-bignum";
import { ReadBuffer } from "../primitives/readbuffer";
import { seal_caller, seal_value_transferred } from "as-contract-runtime";
import { MessageInputReader } from "../primitives/inputdata";
import { UInt128 } from "as-scale-codec";
import { AccountId } from "./AccountId";

class Msg {
    private _sender: AccountId | null = null;
    private _value: UInt128 | null = null;
    private _sig: u8[] | null = null;
    private _data: u8[] | null = null;

    private _isMutates: bool = true;

    set mutates(mu: bool) {
        this._isMutates = mu;
    }

    get value(): u128 {
        if (this._value === null) {
            this._value = ReadBuffer.readInstance<UInt128>(
                seal_value_transferred
            );
        }
        return this._value!.unwrap();
    }

    get sender(): AccountId {
        if (this._sender === null) {
            let readbuf = new ReadBuffer(32);
            seal_caller(readbuf.valueBuffer, readbuf.sizeBuffer);
            this._sender = AccountId.from(readbuf.valueBytes);
        }

        return this._sender!;
    }

    get sig(): u8[] {
        if (this._sig === null) {
            this.init_sig_and_data();
        }
        return this._sig!;
    }

    get data(): u8[] {
        if (this._data === null) {
            this.init_sig_and_data();
        }
        return this._data!;
    }

    notPayable(): bool {
        return this.value == u128.Zero;
    }

    denyPayment(): void {
        assert(this.value === u128.Zero, "It is a none payable function.");
    }

    isSelector(selector: u8[]): bool {
        if (this.sig.length != selector.length) return false;
        return (
            memory.compare(
                this.sig.dataStart,
                selector.dataStart,
                4
            ) == 0
        );
    }

    private init_sig_and_data(): void {
        if (this._sig === null || this._data === null) {
            const reader = MessageInputReader.readInput();
            if (this._sig === null) {
                this._sig = new Array<u8>(4);
                memory.copy(
                    this._sig!.dataStart,
                    reader.fnSelector.dataStart,
                    4
                );
            }

            const datalen = reader.fnParameters.length;
            if (this._data === null) {
                if (datalen > 0) {
                    this._data = new Array<u8>(datalen);
                    memory.copy(
                        this._data!.dataStart,
                        reader.fnParameters.dataStart,
                        datalen
                    );
                } else {
                    this._data = [];
                }
            }
        }
    }
}

export const msg: Msg = new Msg();