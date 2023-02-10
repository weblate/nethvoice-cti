// Copyright (C) 2023 Nethesis S.r.l.
// SPDX-License-Identifier: AGPL-3.0-or-later

import axios from 'axios'
import { exactDistanceToNowLoc, formatDurationLoc } from './dateTime'
import { loadPreference } from './storage'
import { handleNetworkError } from './utils'

export const PAGE_SIZE = 10
export const DEFAULT_OUTCOME_FILTER = 'lost'

export const searchStringInQueue = (queue: any, queryText: string) => {
  const regex = /[^a-zA-Z0-9]/g
  queryText = queryText.replace(regex, '')
  let found = false

  // search in string attributes
  found = ['name', 'queue'].some((attrName) => {
    return new RegExp(queryText, 'i').test(queue[attrName]?.replace(regex, ''))
  })

  if (found) {
    return true
  }
  return false
}

export const retrieveQueues = async (mainextension: string) => {
  try {
    const { data } = await axios.get('/astproxy/queues')
    let queues: any = {}

    console.log('queues data', data) ////

    // keep only user queues

    Object.keys(data).map((queueNum: string) => {
      const queue = data[queueNum]

      if (queue.members[mainextension]) {
        queues[queueNum] = queue
      }
    })

    console.log('retrieveQueues', queues) ////

    return queues
  } catch (error) {
    handleNetworkError(error)
    throw error
  }
}

export const retrieveQueueCalls = async (
  pageNum: number,
  queues: any,
  pageSize: number = PAGE_SIZE,
) => {
  const offset = (pageNum - 1) * pageSize
  try {
    //// fix arguments
    const { data } = await axios.get(
      `/astproxy/queue_recall/12/401,402,404,405,410,603/all?limit=${pageSize}&offset=${offset}`,
    )

    // total pages
    data.totalPages = Math.ceil(data.count / pageSize)

    console.log('retrieveQueueCalls', data) ////

    return data
  } catch (error) {
    handleNetworkError(error)
    throw error
  }
}

export const retrieveQueueStats = async () => {
  try {
    let { data } = await axios.get('/astproxy/queue_astats')

    // compute missing stats

    let lastLogin = 0
    let lastLogout = 0
    let lastCall = 0
    let answeredCalls = 0
    let missedCalls = 0

    Object.keys(data).map((queueNum: string) => {
      const queue = data[queueNum]

      // last login
      if (queue.last_login_time) {
        if (!lastLogin || lastLogin < queue.last_login_time) {
          lastLogin = queue.last_login_time
        }
      }

      // last logout
      if (queue.last_logout_time) {
        if (!lastLogout || lastLogout < queue.last_logout_time) {
          lastLogout = queue.last_logout_time
        }
      }

      // last call
      if (queue.last_call_time) {
        if (!lastCall || lastCall < queue.last_call_time) {
          lastCall = queue.last_call_time
        }
      }

      // answered calls
      if (queue.calls_taken) {
        answeredCalls += queue.calls_taken
      }

      // missed calls
      if (queue.no_answer_calls) {
        missedCalls += queue.no_answer_calls
      }
    })

    if (lastLogin) {
      data.lastLogin = new Date(lastLogin * 1000).toLocaleTimeString()
    }

    if (lastLogout) {
      data.lastLogout = new Date(lastLogout * 1000).toLocaleTimeString()
    }

    if (lastCall) {
      data.fromLastCall = exactDistanceToNowLoc(new Date(lastCall * 1000))
    }

    data.answeredCalls = answeredCalls
    data.missedCalls = missedCalls

    // time at phone
    data.timeAtPhone = formatDurationLoc(
      (data.outgoingCalls?.duration_outgoing || 0) + (data.incomingCalls?.duration_incoming || 0),
    )

    console.log('stats', data) ////

    return data
  } catch (error) {
    handleNetworkError(error)
    throw error
  }
}

export const getFilterValues = (currentUsername: string) => {
  const outcome = loadPreference('queuesOutcomeFilter', currentUsername) || DEFAULT_OUTCOME_FILTER

  //// TODO selected queues

  return { outcome }
}
