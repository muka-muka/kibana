/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import {
  Container,
  ContainerInput,
  ContainerOutput,
  Embeddable,
  EmbeddableFactory,
  EmbeddableInput,
  Filter,
  Query,
  RefreshConfig,
  ViewMode,
} from 'plugins/embeddable_api/index';
import React from 'react';
import ReactDOM from 'react-dom';
import { TimeRange } from 'ui/timefilter/time_history';
import uuid from 'uuid';

import { I18nProvider } from '@kbn/i18n/react';
import { DASHBOARD_CONTAINER_TYPE } from './dashboard_container_factory';
import { createPanelState } from './panel';
import { DashboardPanelState, PanelStateMap } from './types';
// @ts-ignore
import { DashboardViewport } from './viewport/dashboard_viewport';

export interface DashboardContainerInput extends ContainerInput {
  viewMode: ViewMode;
  filters: Filter[];
  query: Query;
  timeRange: TimeRange;
  refreshConfig: RefreshConfig;
  expandedPanelId?: string;
  useMargins: boolean;
  title: string;
  description: string;
  isFullScreenMode: boolean;
  panels: PanelStateMap;
}

export interface DashboardEmbeddableInput extends EmbeddableInput {
  customization: any;
  filters: Filter[];
  isPanelExpanded: boolean;
  query: Query;
  timeRange: TimeRange;
  refreshConfig: RefreshConfig;
  viewMode: ViewMode;
  savedObjectId?: string;
  hidePanelTitles?: boolean;
}

export interface DashboardEmbeddableOutput {
  customization: any;
  title: string;
}

export type DashboardEmbeddable = Embeddable<DashboardEmbeddableInput, DashboardEmbeddableOutput>;

export class DashboardContainer extends Container<DashboardContainerInput, ContainerOutput> {
  constructor(
    initialInput: DashboardContainerInput,
    private getEmbeddableFactory: <I, O>(type: string) => EmbeddableFactory<I, O> | undefined
  ) {
    super(DASHBOARD_CONTAINER_TYPE, initialInput, { ...initialInput, embeddableLoaded: {} });

    // this.subscribeToInputChanges(input => this.emitOutputChanged(input));
  }

  public createNewPanelState(type: string, id?: string): DashboardPanelState {
    const embeddableId = id || uuid.v4();
    return createPanelState({ id: embeddableId }, type, Object.values(this.input.panels));
  }

  public onToggleExpandPanel(id: string) {
    const newValue = this.input.expandedPanelId ? undefined : id;
    this.setInput({
      ...this.input,
      expandedPanelId: newValue,
    });
  }

  public onPanelsUpdated = (panels: PanelStateMap) => {
    this.setInput({
      ...this.input,
      panels: {
        ...panels,
      },
    });
  };

  public onExitFullScreenMode = () => {
    this.setInput({
      ...this.input,
      isFullScreenMode: false,
    });
  };

  public render(dom: React.ReactNode) {
    ReactDOM.render(
      // @ts-ignore
      <I18nProvider>
        <DashboardViewport getEmbeddableFactory={this.getEmbeddableFactory} container={this} />
      </I18nProvider>,
      dom
    );
  }

  public getInputForEmbeddable(panelState: DashboardPanelState): DashboardEmbeddableInput {
    const isPanelExpanded = this.input.expandedPanelId === panelState.embeddableId;
    const { viewMode, refreshConfig, timeRange, query, hidePanelTitles, filters } = this.input;
    return {
      filters,
      hidePanelTitles,
      isPanelExpanded,
      query,
      timeRange,
      refreshConfig,
      viewMode,
      ...panelState.initialInput,
      customization: panelState.customization,
      id: panelState.embeddableId,
    };
  }
}
