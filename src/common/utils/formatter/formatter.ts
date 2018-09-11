/*
 * Copyright 2015-2016 Imply Data, Inc.
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

import { Duration, Timezone } from "chronoshift";
import * as numeral from "numeral";

import { NumberRange, TimeRange } from "plywood";
import { STRINGS } from "../../../client/config/constants";
import { Dimension } from "../../models/dimension/dimension";
import { FilterClause, FixedTimeFilterClause, isTimeFilter, StringFilterAction, StringFilterClause, TimeFilterClause, TimeFilterPeriod } from "../../models/filter-clause/filter-clause";

import { DisplayYear, formatTimeRange } from "../../utils/time/time";

export type Formatter = (n: number) => string;

const scales: Record<string, Record<string, number>> = {
  a: {
    "": 1,
    "k": 1e3,
    "m": 1e6,
    "b": 1e9,
    "t": 1e12
  },
  b: {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
    TB: 1024 * 1024 * 1024 * 1024,
    PB: 1024 * 1024 * 1024 * 1024 * 1024,
    EB: 1024 * 1024 * 1024 * 1024 * 1024 * 1024,
    ZB: 1024 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024,
    YB: 1024 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024
  }
};

export function getMiddleNumber(values: number[]): number {
  const filteredAbsData: number[] = [];
  for (let v of values) {
    if (v === 0 || isNaN(v) || !isFinite(v)) continue;
    filteredAbsData.push(Math.abs(v));
  }

  const n = filteredAbsData.length;
  if (n) {
    filteredAbsData.sort((a, b) => b - a);
    return filteredAbsData[Math.ceil((n - 1) / 2)];
  } else {
    return 0;
  }
}

export function formatterFromData(values: number[], format: string): Formatter {
  const match = format.match(/^(\S*)( ?)([ab])$/);
  if (match) {
    const numberFormat = match[1];
    const space = match[2];
    const formatType = match[3];
    const middle = getMiddleNumber(values);
    const formatMiddle = numeral(middle).format("0 " + formatType);
    const unit = formatMiddle.split(" ")[1] || "";
    const scale = scales[formatType][unit];
    const append = unit ? space + unit : "";

    return (n: number) => {
      if (isNaN(n) || !isFinite(n)) return "-";
      return numeral(n / scale).format(numberFormat) + append;
    };
  } else {
    return (n: number) => {
      if (isNaN(n) || !isFinite(n)) return "-";
      return numeral(n).format(format);
    };
  }
}

export function formatNumberRange(value: NumberRange) {
  return `${formatValue(value.start || "any")} to ${formatValue(value.end || "any")}`;
}

export function formatValue(value: any, timezone?: Timezone, displayYear?: DisplayYear): string {
  if (NumberRange.isNumberRange(value)) {
    return formatNumberRange(value);
  } else if (TimeRange.isTimeRange(value)) {
    return formatTimeRange(value, timezone, displayYear);
  } else {
    return "" + value;
  }
}

export function formatFilterClause(dimension: Dimension, clause: FilterClause, timezone: Timezone): string {
  const { title, values } = this.getFormattedClause(dimension, clause, timezone);
  return title ? `${title} ${values}` : values;
}

function getFilterClauseValues(clause: FilterClause, timezone: Timezone): string {
  if (isTimeFilter(clause)) {
    return getFormattedTimeClauseValues(clause as TimeFilterClause, timezone);
  }
  let values: string;
  const setElements = clause.values;
  if (setElements.count() > 1) {
    values = `(${setElements.count()})`;
  } else {
    values = formatValue(setElements.first());
  }
  if (clause instanceof StringFilterClause && clause.action === StringFilterAction.MATCH) values = `/${values}/`;
  if (clause instanceof StringFilterClause && clause.action === StringFilterAction.CONTAINS) values = `"${values}"`;
  return values;
}

function getClauseLabel(clause: FilterClause, dimension: Dimension) {
  const dimensionTitle = dimension.title;
  if (isTimeFilter(clause)) return "";
  const delimiter = clause instanceof StringFilterClause && [StringFilterAction.MATCH, StringFilterAction.CONTAINS].indexOf(clause.action) !== -1 ? " ~" : ":";

  const clauseValues = clause.values;
  if (clauseValues && clauseValues.count() > 1) return `${dimensionTitle}`;
  return `${dimensionTitle}${delimiter}`;
}

export function getFormattedClause(dimension: Dimension, clause: FilterClause, timezone: Timezone): { title: string, values: string } {
  return { title: getClauseLabel(clause, dimension), values: getFilterClauseValues(clause, timezone) };
}

function getFormattedTimeClauseValues(clause: TimeFilterClause, timezone: Timezone): string {
  if (clause instanceof FixedTimeFilterClause) {
    return formatTimeRange(TimeRange.fromJS(clause.values.get(0)), timezone, DisplayYear.IF_DIFF);
  }
  const { period, duration } = clause;
  switch (period) {
    case TimeFilterPeriod.PREVIOUS:
      return `${STRINGS.previous} ${getQualifiedDurationDescription(duration)}`;
    case TimeFilterPeriod.CURRENT:
      return `${STRINGS.current} ${getQualifiedDurationDescription(duration)}`;
    case TimeFilterPeriod.LATEST:
      return `${STRINGS.latest} ${getQualifiedDurationDescription(duration)}`;
  }
}

function getQualifiedDurationDescription(duration: Duration) {
  if (duration.toString() === "P3M") {
    return STRINGS.quarter.toLowerCase();
  } else {
    return duration.getDescription();
  }
}
