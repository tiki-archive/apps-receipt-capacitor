/*
 * Copyright (c) TIKI Inc.
 * MIT license. See LICENSE file in root directory.
 */

import type { Repository } from "@/service/store/repository";
import { getWeek } from "@/utils/week";
import { BulletState } from "@/components/bullet/bullet-state";
import { reactive, readonly } from "vue";


export class StateReceipt {
  private readonly repository: Repository;
  private readonly key: string = "receipt";
  private state: Map<string, Date> = new Map<string, Date>();
  private _status = reactive({
    bulletState: BulletState.P0,
  });

  constructor(repository: Repository) {
    this.repository = repository;
  }

  get = (): Map<string, Date> => this.state;

  get getStatus() {
    return readonly(this._status);
  }

  async load(): Promise<void> {
    const saved: string | undefined = await this.repository.read(this.key);
    if (!saved) return this.reset();
    const list: [string, number][] = JSON.parse(saved);
    this.state = new Map(
      list.map((i: [string, number]): [string, Date] => [i[0], new Date(i[1])]),
    );
  }

  async add(receiptId: string, date: Date = new Date()): Promise<void> {
    this.state.set(receiptId, date);
    this.status()
    return this.repository.write(this.key, this.toString());
  }

  count(
    filter: { startWeek: number; endWeek: number } | undefined = undefined,
  ): number {
    let count = 0;
    if (!filter) count = this.state.size;
    else {
      this.state.forEach((date, _receiptId) => {
        const week = getWeek(date);
        if (week >= filter.startWeek && week < filter.endWeek) count += 1;
      });
    }
    return count;
  }

  async reset(): Promise<void> {
    this.state = new Map<string, Date>();
    return this.repository.write(this.key, this.toString());
  }

  toString = (): string =>
    JSON.stringify(
      Array.from(this.state.entries()).map(
        (pair: [string, Date]): [string, number] => [
          pair[0],
          pair[1].getTime(),
        ],
      ),
    );

  status(week: number = getWeek()): BulletState {
    const count = this.count({
      startWeek: week - 4,
      endWeek: week + 1,
    });
    switch (count) {
      case 0:
        return this._status.bulletState = BulletState.P0;
      case 1:
        return this._status.bulletState = BulletState.P20;
      case 2:
        return this._status.bulletState = BulletState.P40;
      case 3:
        return this._status.bulletState = BulletState.P60;
      case 4:
        return this._status.bulletState = BulletState.P80;
      default:
        return this._status.bulletState = BulletState.P100;
    }
  }
  }

