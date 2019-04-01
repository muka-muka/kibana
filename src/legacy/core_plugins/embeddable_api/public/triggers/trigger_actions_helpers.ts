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

import chrome from 'ui/chrome';
import { TriggerActionsSavedObjectAttributes } from './trigger_actions_saved_object';

export async function addTriggerActionMapping({
  triggerId,
  actionId,
}: {
  triggerId: string;
  actionId: string;
}) {
  const savedObjectsClient = await chrome.getSavedObjectsClient();
  const response = await savedObjectsClient.get<TriggerActionsSavedObjectAttributes>(
    'ui_trigger',
    triggerId
  );

  if (response.error && response.error.statusCode === 404) {
    // Create a mapping with this trigger id, it doesn't exist.
    await savedObjectsClient.create('ui_trigger', { actions: actionId }, { id: triggerId });
  } else if (!response.error) {
    const actionIds = await getActionIdsForTrigger(triggerId);
    actionIds.push(actionId);
    // Add the action to the existing mapping.
    await savedObjectsClient.update('ui_trigger', triggerId, { actions: actionIds.join(';') });
  } else {
    throw new Error(`Unexpected result searching for Event with id ${triggerId}`);
  }
}

export async function removeTriggerActionMapping({
  triggerId,
  actionId,
}: {
  triggerId: string;
  actionId: string;
}) {
  const savedObjectsClient = await chrome.getSavedObjectsClient();
  const response = await savedObjectsClient.get<TriggerActionsSavedObjectAttributes>(
    'ui_trigger',
    triggerId
  );

  if (response.error && response.error.statusCode === 404) {
    // A mapping with this trigger id doesn't exist.
    return;
  } else if (!response.error) {
    const actionIds = await getActionIdsForTrigger(triggerId);
    const newActionIds = actionIds.filter(id => id === actionId);
    // Add the action to the existing mapping.
    await savedObjectsClient.update('ui_trigger', triggerId, { actions: newActionIds.join(';') });
  } else {
    throw new Error(`Unexpected result searching for Event with id ${triggerId}`);
  }
}

async function getActionIdsForTrigger(triggerId: string) {
  const savedObjectsClient = chrome.getSavedObjectsClient();
  const response = await savedObjectsClient.get<TriggerActionsSavedObjectAttributes>(
    'ui_trigger',
    triggerId
  );
  return response.attributes.actions && response.attributes.actions !== ''
    ? response.attributes.actions.split(';')
    : [];
}

export async function getDoesTriggerExist({ triggerId }: { triggerId: string; actionId: string }) {
  const response = await chrome
    .getSavedObjectsClient()
    .get<TriggerActionsSavedObjectAttributes>('ui_trigger', triggerId);
  if (response.error && response.error.statusCode === 404) {
    return false;
  } else if (!response.error) {
    return true;
  } else {
    throw new Error(`Unexpected result searching for Event with id ${triggerId}`);
  }
}
