/*
 * Copyright 2017-2018 Allegro.pl
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { OrderedSet } from "immutable";
import { createMeasures, Measures } from "../../models/essence/essence";

export interface MeasuresDefinitionJS {
  isMulti: boolean;
  single: string;
  multi: string[];
}

export interface MeasuresDefinitionConverter {
  fromEssenceMeasures(measures: Measures): MeasuresDefinitionJS;

  toEssenceMeasures(measures: MeasuresDefinitionJS): Measures;
}

export const measuresDefinitionConverter: MeasuresDefinitionConverter = {
  fromEssenceMeasures: ({ multi, isMulti, single }) =>
    ({ isMulti, single, multi: multi.toArray() }),
  toEssenceMeasures: ({ isMulti, multi, single }) =>
    createMeasures({ isMulti, single, multi: OrderedSet.of(...multi) })
};
