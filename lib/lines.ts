// Copyright (C) 2023 Nethesis S.r.l.
// SPDX-License-Identifier: AGPL-3.0-or-later

import axios from 'axios'
import { handleNetworkError, getApiEndpoint, getApiScheme } from './utils'
import { store } from '../store'
import { loadPreference } from './storage'

export const PAGE_SIZE = 10
export const DEFAULT_SORT_BY = 'description'
export const DEFAULT_SORT_BY_ANNOUNCEMENT = 'description'

const apiEnpoint = getApiEndpoint()
const apiScheme = getApiScheme()
const apiUrl = apiScheme + apiEnpoint

export async function retrieveLines() {
  let userUrlApi = apiUrl + '/webrest/offhour/list'

  try {
    const { data, status } = await axios.get(userUrlApi)
    return data
  } catch (error) {
    handleNetworkError(error)
    throw error
  }
}

export const openShowTelephoneLinesDrawer = (name: any, number: any) => {
  const config = { name, number }

  store.dispatch.sideDrawer.update({
    isShown: true,
    contentType: 'showTelephoneLines',
    config: config,
  })
}

export const openShowTelephoneAnnouncementDrawer = () => {
  const config = {}

  store.dispatch.sideDrawer.update({
    isShown: true,
    contentType: 'showTelephoneAnnouncement',
    config: config,
  })
}

export const openShowRuleDetailsDrawer = (name: any) => {
  const config = { name }

  store.dispatch.sideDrawer.update({
    isShown: true,
    contentType: 'showRuleDetails',
    config: config,
  })
}

export const getFilterValues = (currentUsername: string) => {
  const sortBy = loadPreference('telephoneLinesSortBy', currentUsername) || DEFAULT_SORT_BY

  return { sortBy }
}

export const getFilterAnnouncementValues = (currentUsername: string) => {
  const sortBy = loadPreference('telephoneAnnouncementSortBy', currentUsername) || DEFAULT_SORT_BY

  return { sortBy }
}
