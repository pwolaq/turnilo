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

import * as React from "react";
import { Clicker } from "../../../common/models/clicker/clicker";
import { Essence } from "../../../common/models/essence/essence";
import { Stage } from "../../../common/models/stage/stage";
import { Fn } from "../../../common/utils/general/general";
import { clamp } from "../../utils/dom/dom";
import { DimensionListTile } from "../dimension-list-tile/dimension-list-tile";
import { MeasuresTile } from "../measures-tile/measures-tile";
import { Direction, ResizeHandle } from "../resize-handle/resize-handle";
import "./dimension-measure-panel.scss";

const MIN_PANEL_SIZE = 100;
const RESIZE_HANDLE_SIZE = 12;

export interface DimensionMeasurePanelProps {
  clicker: Clicker;
  essence: Essence;
  menuStage: Stage;
  triggerFilterMenu: Fn;
  triggerSplitMenu: Fn;
  style?: React.CSSProperties;
}

export interface DimensionMeasurePanelState {
  dividerPosition: number;
  containerHeight: number;
}

function dividerConstraints(height: number) {
  const minDividerPosition = Math.min(MIN_PANEL_SIZE, height);
  const maxDividerPosition = Math.max(height - MIN_PANEL_SIZE, 0);
  return { minDividerPosition, maxDividerPosition };
}

export class DimensionMeasurePanel extends React.Component<DimensionMeasurePanelProps, DimensionMeasurePanelState> {

  state: DimensionMeasurePanelState = {
    containerHeight: 2 * MIN_PANEL_SIZE,
    dividerPosition: MIN_PANEL_SIZE
  };

  containerRef: Element = null;

  calculateInitialPosition = (container: Element) => {
    if (!container) return;

    this.containerRef = container;
    const { height: containerHeight } = this.containerRef.getBoundingClientRect();

    const { essence: { dataCube } } = this.props;
    const dimensionsCount = dataCube.dimensions.size();
    const measuresCount = dataCube.measures.size();
    const ratio = dimensionsCount / (measuresCount + dimensionsCount);

    const { minDividerPosition, maxDividerPosition } = dividerConstraints(containerHeight);
    const dividerPosition = clamp(containerHeight * ratio, minDividerPosition, maxDividerPosition);

    this.setState({ dividerPosition, containerHeight });
  }

  saveDividerPosition = (dividerPosition: number) => this.setState({ dividerPosition });

  saveContainerRect = () => this.setState({ containerHeight: this.containerRef.getBoundingClientRect().height });

  componentDidMount() {
    window.addEventListener("resize", this.saveContainerRect);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.saveContainerRect);
  }

  render() {
    const { clicker, essence, menuStage, triggerFilterMenu, triggerSplitMenu, style } = this.props;
    const { dividerPosition, containerHeight } = this.state;
    const { maxDividerPosition, minDividerPosition } = dividerConstraints(containerHeight);

    const dimensionListStyle: React.CSSProperties = {
      height: dividerPosition
    };

    const measureListStyle: React.CSSProperties = {
      height: containerHeight - dividerPosition - RESIZE_HANDLE_SIZE
    };

    const showResizeHandle = this.containerRef !== null;

    return <div className="dimension-measure-panel" style={style}>
      <div ref={this.calculateInitialPosition} className="dimension-measure-panel--container">
        <DimensionListTile
          clicker={clicker}
          essence={essence}
          menuStage={menuStage}
          triggerFilterMenu={triggerFilterMenu}
          triggerSplitMenu={triggerSplitMenu}
          style={dimensionListStyle}
        />
        {showResizeHandle && <ResizeHandle
          onResize={this.saveDividerPosition}
          direction={Direction.TOP}
          min={minDividerPosition}
          max={maxDividerPosition}
          initialValue={dividerPosition} />}
        <MeasuresTile
          style={measureListStyle}
          clicker={clicker}
          essence={essence}
        />
      </div>
    </div>;
  }
}
