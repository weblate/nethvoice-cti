// Copyright (C) 2023 Nethesis S.r.l.
// SPDX-License-Identifier: AGPL-3.0-or-later

import { FC, ComponentProps, useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, EmptyState } from '../common'
import { isEmpty, debounce } from 'lodash'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { PAGE_SIZE, retrieveQueueCalls } from '../../lib/queues'
import {
  faChevronRight,
  faPhoneMissed,
  faPhoneArrowDown,
  faPhoneArrowUp,
  faPhoneXmark,
  faChevronLeft,
  faPhone,
} from '@nethesis/nethesis-solid-svg-icons'
import classNames from 'classnames'
import { formatDateLoc, getCallTimeToDisplay } from '../../lib/dateTime'
import { CallsViewFilter } from './CallsViewFilter'

//// review

//// find and fix "queue"

export interface CallsViewProps extends ComponentProps<'div'> {
  queues: any
  isLoaded: boolean
}

export const CallsView: FC<CallsViewProps> = ({ queues, isLoaded, className }): JSX.Element => {
  const { t } = useTranslation()
  const [calls, setCalls]: any = useState({})
  const [filteredCalls, setFilteredCalls]: any = useState({})
  const { operators } = useSelector((state: RootState) => state.operators) ////
  const [isApplyingFilters, setApplyingFilters]: any = useState(false)
  const [isCallsLoaded, setCallsLoaded]: any = useState(false)
  const { name, mainPresence, avatar } = useSelector((state: RootState) => state.user) ////
  const [callsError, setCallsError] = useState('')
  const [pageNum, setPageNum]: any = useState(1)
  const [firstRender, setFirstRender]: any = useState(true)

  const [textFilter, setTextFilter]: any = useState('')
  const updateTextFilter = (newTextFilter: string) => {
    setPageNum(1)
    setTextFilter(newTextFilter)
    setCallsLoaded(false)
  }

  const debouncedUpdateTextFilter = useMemo(() => debounce(updateTextFilter, 400), [])

  // stop invocation of debounced function after unmounting
  useEffect(() => {
    return () => {
      debouncedUpdateTextFilter.cancel()
    }
  }, [debouncedUpdateTextFilter])

  const [outcomeFilter, setOutcomeFilter]: any = useState('')
  const updateOutcomeFilter = (newOutcomeFilter: string) => {
    setOutcomeFilter(newOutcomeFilter)
  }

  //// TODO select all queues by default?
  const [queuesFilter, setQueuesFilter]: any = useState([])
  const updateQueuesFilter = (newQueuesFilter: string[]) => {
    setQueuesFilter(newQueuesFilter)
  }

  // const [textFilter, setTextFilter]: any = useState('') //// remove
  // const [debouncedTextFilter, setDebouncedTextFilter] = useState(false)

  // const toggleDebouncedTextFilter = () => {
  //   setDebouncedTextFilter(!debouncedTextFilter)
  // }

  // const changeTextFilter = (event: any) => {
  //   const newTextFilter = event.target.value
  //   setTextFilter(newTextFilter)
  //   debouncedUpdateTextFilter()
  // }

  // const debouncedUpdateTextFilter = useMemo(
  //   () => debounce(toggleDebouncedTextFilter, 400),
  //   [debouncedTextFilter],
  // )

  // const textFilterRef = useRef() as React.MutableRefObject<HTMLInputElement>
  // const clearTextFilter = () => {
  //   setTextFilter('')
  //   debouncedUpdateTextFilter()
  //   textFilterRef.current.focus()
  // }

  // // stop invocation of debounced function after unmounting
  // useEffect(() => {
  //   return () => {
  //     debouncedUpdateTextFilter.cancel()
  //   }
  // }, [debouncedUpdateTextFilter])

  const applyFilters = (calls: any) => {
    setApplyingFilters(true) ////

    // // text filter ////
    // let filteredCalls = Object.values(queues).filter((queue) =>
    //   searchStringInQueue(queue, textFilter),
    // )

    // // sort queues
    // filteredCalls.sort(sortByProperty('name'))
    // filteredCalls.sort(sortByProperty('queue'))

    //// fix
    let filteredCalls = calls

    setFilteredCalls(filteredCalls)
    setApplyingFilters(false)
  }

  // retrieve calls
  useEffect(() => {
    if (firstRender) {
      setFirstRender(false)
      return
    }

    async function fetchCalls() {
      if (!isCallsLoaded) {
        // if (!isCallsLoaded && contactType && sortBy) { //// include filters

        const queuesList = Object.keys(queues)

        try {
          setCallsError('')
          // const res = await getQueueCalls(pageNum, textFilter, contactType, sortBy) //// include filters
          const res = await retrieveQueueCalls(pageNum, queuesList)

          // setCalls(mapPhonebookResponse(res)) ////

          console.log('calls', res) ////

          setCalls(res)
        } catch (e) {
          console.error(e)
          setCallsError(t('Queues.Cannot retrieve calls') || '')
        }
        setCallsLoaded(true)
      }
    }
    fetchCalls()
  }, [firstRender, isCallsLoaded, calls, pageNum, textFilter])
  // }, [isCallsLoaded, calls, pageNum, textFilter, contactType, sortBy]) ////

  // filtered calls
  useEffect(() => {
    applyFilters(calls)
  }, [calls])
  // }, [calls, debouncedTextFilter]) ////

  function goToPreviousPage() {
    if (pageNum > 1) {
      setCallsLoaded(false)
      setPageNum(pageNum - 1)
    }
  }

  function goToNextPage() {
    if (pageNum < calls.totalPages) {
      setCallsLoaded(false)
      setPageNum(pageNum + 1)
    }
  }

  function isPreviousPageButtonDisabled() {
    return !isCallsLoaded || pageNum <= 1
  }

  function isNextPageButtonDisabled() {
    return !isCallsLoaded || pageNum >= calls?.totalPages
  }

  const getCallIcon = (call: any) => {
    switch (call.direction) {
      case 'IN':
        if (
          ['ANSWERED', 'DONE', 'COMPLETEAGENT', 'COMPLETECALLER', 'CONNECT', 'ENTERQUEUE'].includes(
            call.event,
          )
        ) {
          // positive outcome
          return (
            <FontAwesomeIcon
              icon={faPhoneArrowDown}
              className='mr-2 h-5 w-3.5 text-green-600 dark:text-green-400'
              aria-hidden='true'
            />
          )
        } else {
          // negative outcome
          return (
            <FontAwesomeIcon
              icon={faPhoneMissed}
              className='mr-2 h-5 w-4 text-red-400 dark:text-red-500'
              aria-hidden='true'
            />
          )
        }
        break
      case 'OUT':
        if (
          ['ANSWERED', 'DONE', 'COMPLETEAGENT', 'COMPLETECALLER', 'CONNECT', 'ENTERQUEUE'].includes(
            call.event,
          )
        ) {
          // positive outcome
          return (
            <FontAwesomeIcon
              icon={faPhoneArrowUp}
              className='mr-2 h-5 w-3.5 text-green-600 dark:text-green-400'
              aria-hidden='true'
            />
          )
        } else {
          // negative outcome
          return (
            <FontAwesomeIcon
              icon={faPhoneXmark}
              className='mr-2 h-5 w-4 text-red-400 dark:text-red-500'
              aria-hidden='true'
            />
          )
        }
        break
    }
  }

  return (
    <div className={classNames(className)}>
      <div className='flex flex-col xl:flex-row justify-between gap-x-4 xl:items-end'>
        <CallsViewFilter
          queues={queues}
          updateTextFilter={debouncedUpdateTextFilter}
          updateOutcomeFilter={updateOutcomeFilter}
          updateQueuesFilter={updateQueuesFilter}
        />
        <div className='flex text-sm gap-4 text-right pb-4 xl:pb-7'>
          <div className='text-gray-500 dark:text-gray-400'>
            {t('Queues.Last update')}: {formatDateLoc(new Date(), 'HH:mm:ss')} (
            {t('Queues.every_time_interval', { timeInterval: '20 seconds' })})
          </div>
          <button type='button' className='hover:underline text-gray-700 dark:text-gray-200'>
            {t('Queues.Settings')}
          </button>
        </div>
      </div>
      <div className='mx-auto'>
        <div className='flex flex-col'>
          <div className='-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8'>
            <div className='inline-block min-w-full py-2 align-middle md:px-6 lg:px-8'>
              <div className='overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg'>
                <table className='min-w-full divide-y divide-gray-300'>
                  <thead className='bg-white'>
                    <tr>
                      <th
                        scope='col'
                        className='py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-700 sm:pl-6'
                      >
                        Time
                      </th>
                      <th
                        scope='col'
                        className='px-3 py-3.5 text-left text-sm font-semibold text-gray-700'
                      >
                        {t('Queues.Queue')}
                      </th>
                      <th
                        scope='col'
                        className='px-3 py-3.5 text-left text-sm font-semibold text-gray-700'
                      >
                        {t('Queues.Name')}
                      </th>
                      <th
                        scope='col'
                        className='px-3 py-3.5 text-left text-sm font-semibold text-gray-700'
                      >
                        {t('Queues.Company')}
                      </th>
                      <th
                        scope='col'
                        className='px-3 py-3.5 text-left text-sm font-semibold text-gray-700'
                      >
                        {t('Queues.Outcome')}
                      </th>
                      <th scope='col' className='relative py-3.5 pl-3 pr-4 sm:pr-6'>
                        <span className='sr-only'>{t('Queues.Details')}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-200 bg-white text-gray-700 text-sm'>
                    {/* skeleton */}
                    {(!isCallsLoaded || isApplyingFilters) &&
                      Array.from(Array(5)).map((e, i) => (
                        <tr key={i}>
                          {Array.from(Array(6)).map((e, j) => (
                            <td key={j}>
                              <div className='px-4 py-6'>
                                <div className='animate-pulse h-5 rounded bg-gray-300 dark:bg-gray-600'></div>
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    {/* calls */}
                    {isCallsLoaded &&
                      !isEmpty(filteredCalls) &&
                      filteredCalls.rows.map((call: any, index: number) => (
                        <tr key={index}>
                          {/* time */}
                          <td className='whitespace-nowrap py-4 pl-4 pr-3 sm:pl-6'>
                            <div className='flex flex-col'>
                              <div>{formatDateLoc(call.time * 1000, 'PP')}</div>
                              <div className='text-gray-500 dark:text-gray-500'>
                                {getCallTimeToDisplay(call.time * 1000)}
                              </div>
                            </div>
                          </td>
                          {/* queue */}
                          <td className='whitespace-nowrap px-3 py-4'>
                            <div>{queues[call.queuename]?.name}</div>
                            <div className='text-gray-500 dark:text-gray-500'>{call.queuename}</div>
                          </td>
                          {/* name / number */}
                          <td className='whitespace-nowrap px-3 py-4'>
                            {call.name && <div>{call.name || '-'}</div>}
                            <div
                              className={classNames(
                                call.name && 'text-gray-500 dark:text-gray-500',
                              )}
                            >
                              {call.cid}
                            </div>
                          </td>
                          {/* company */}
                          <td className='whitespace-nowrap px-3 py-4'>{call.company || '-'}</td>
                          {/* outcome */}
                          <td className='whitespace-nowrap px-3 py-4'>
                            <div className='flex items-center'>
                              <span>{getCallIcon(call)}</span>
                              <span>{t(`Queues.outcome_${call.event}`)}</span>
                            </div>
                          </td>
                          {/* show details */}
                          <td className='relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6'>
                            <FontAwesomeIcon
                              icon={faChevronRight}
                              className='h-3 w-3 p-2 cursor-pointer text-gray-500 dark:text-gray-500'
                              aria-hidden='true'
                            />
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {/* empty state */}
                {isCallsLoaded && isEmpty(calls.rows) && (
                  <EmptyState
                    title={t('Queues.No calls')}
                    description={t('Queues.There are no recent calls on your queues') || ''}
                    icon={
                      <FontAwesomeIcon
                        icon={faPhone}
                        className='mx-auto h-12 w-12'
                        aria-hidden='true'
                      />
                    }
                    className='bg-white'
                  ></EmptyState>
                )}

                {/* no search results */}

                {/* {isCallsLoaded && !isEmpty(calls) && isEmpty //// (filteredCalls) && (
                  <EmptyState
                    title={t('Queues.No queues')}
                    description={t('Common.Try changing your search filters') || ''}
                    icon={
                      <FontAwesomeIcon icon={faFilter} className='mx-auto h-12 w-12' aria-hidden='true' />
                    }
                  />
                )}
                <ul role='list' className='grid grid-cols-1 gap-6 md:grid-cols-2 3xl:grid-cols-3'> */}
              </div>
            </div>
          </div>
        </div>
        {/* pagination */}
        {!callsError && !!calls?.rows?.length && (
          <nav
            className='flex items-center justify-between border-t px-0 py-4 mb-8 border-gray-100 dark:border-gray-800'
            aria-label='Pagination'
          >
            <div className='hidden sm:block'>
              <p className='text-sm text-gray-700 dark:text-gray-200'>
                {t('Common.Showing')}{' '}
                <span className='font-medium'>{PAGE_SIZE * (pageNum - 1) + 1}</span> -&nbsp;
                <span className='font-medium'>
                  {PAGE_SIZE * (pageNum - 1) + PAGE_SIZE < calls?.count
                    ? PAGE_SIZE * (pageNum - 1) + PAGE_SIZE
                    : calls?.count}
                </span>{' '}
                {t('Common.of')} <span className='font-medium'>{calls?.count}</span>{' '}
                {t('Queues.calls')}
              </p>
            </div>
            <div className='flex flex-1 justify-between sm:justify-end'>
              <Button
                type='button'
                variant='white'
                disabled={isPreviousPageButtonDisabled()}
                onClick={() => goToPreviousPage()}
                className='flex items-center'
              >
                <FontAwesomeIcon icon={faChevronLeft} className='mr-2 h-4 w-4' />
                <span> {t('Common.Previous page')}</span>
              </Button>
              <Button
                type='button'
                variant='white'
                className='ml-3 flex items-center'
                disabled={isNextPageButtonDisabled()}
                onClick={() => goToNextPage()}
              >
                <span>{t('Common.Next page')}</span>
                <FontAwesomeIcon icon={faChevronRight} className='ml-2 h-4 w-4' />
              </Button>
            </div>
          </nav>
        )}

        {/* {isLoaded && //// 
          !isEmpty(filteredCalls) &&
          filteredCalls.rows.map((call: any, index: number) => {
            return (
              <li key={index}>
                <div className='flex items-center px-4 py-4 sm:px-6'>
                  <div className='flex min-w-0 flex-1 items-center'>
                    <div className='min-w-0 flex-1 px-4 md:grid md:grid-cols-2 md:gap-4'>
                      <div>
                        <p className='truncate text-sm font-medium text-indigo-600'>
                          {application.applicant.name}
                        </p>
                        <p className='mt-2 flex items-center text-sm text-gray-500'>
                          <EnvelopeIcon
                            className='mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400'
                            aria-hidden='true'
                          />
                          <span className='truncate'>{application.applicant.email}</span>
                        </p>
                      </div>
                      <div className='hidden md:block'>
                        <div>
                          <p className='text-sm text-gray-900'>
                            Applied on{' '}
                            <time dateTime={application.date}>{application.dateFull}</time>
                          </p>
                          <p className='mt-2 flex items-center text-sm text-gray-500'>
                            <CheckCircleIcon
                              className='mr-1.5 h-5 w-5 flex-shrink-0 text-green-400'
                              aria-hidden='true'
                            />
                            {application.stage}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className='inline-flex h-10 w-10 flex-shrink-0 items-center justify-center'>
                      <FontAwesomeIcon
                        icon={faChevronRight}
                        className='h-3 w-3 text-gray-400 dark:text-gray-500'
                        aria-hidden='true'
                      />
                    </span>
                  </div>
                </div>
              </li>
            )
          })} */}
      </div>
    </div>
  )
}

CallsView.displayName = 'CallsView'
