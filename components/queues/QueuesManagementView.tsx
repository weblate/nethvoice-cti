// Copyright (C) 2023 Nethesis S.r.l.
// SPDX-License-Identifier: AGPL-3.0-or-later

import { FC, ComponentProps, useState, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Avatar, Button, EmptyState, IconSwitch, TextInput } from '../common'
import { isEmpty, debounce } from 'lodash'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import { sortByProperty } from '../../lib/utils'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { searchStringInQueue } from '../../lib/queues'
import {
  faChevronDown,
  faCircleXmark,
  faFilter,
  faHeadset,
  faPause,
  faPhone,
  faStar,
  faUsers,
  faArrowDownLeftAndArrowUpRightToCenter,
  faChevronUp,
  faUserXmark,
} from '@nethesis/nethesis-solid-svg-icons'
import { getOperatorByPhoneNumber } from '../../lib/operators'
import classNames from 'classnames'
import { LoggedStatus } from './LoggedStatus'

export interface QueuesManagementViewProps extends ComponentProps<'div'> {
  queues: any
  isLoaded: boolean
}

export const QueuesManagementView: FC<QueuesManagementViewProps> = ({
  queues,
  isLoaded,
  className,
}): JSX.Element => {
  const { t } = useTranslation()
  const [filteredQueues, setFilteredQueues]: any = useState({})
  const { operators } = useSelector((state: RootState) => state.operators)
  const [isApplyingFilters, setApplyingFilters]: any = useState(false)
  const { name, mainPresence, mainextension, avatar } = useSelector(
    (state: RootState) => state.user,
  )

  const [textFilter, setTextFilter]: any = useState('')
  const [debouncedTextFilter, setDebouncedTextFilter] = useState(false)

  const toggleDebouncedTextFilter = () => {
    setDebouncedTextFilter(!debouncedTextFilter)
  }

  const changeTextFilter = (event: any) => {
    const newTextFilter = event.target.value
    setTextFilter(newTextFilter)
    debouncedUpdateTextFilter()
  }

  const debouncedUpdateTextFilter = useMemo(
    () => debounce(toggleDebouncedTextFilter, 400),
    [debouncedTextFilter],
  )

  const textFilterRef = useRef() as React.MutableRefObject<HTMLInputElement>
  const clearTextFilter = () => {
    setTextFilter('')
    debouncedUpdateTextFilter()
    textFilterRef.current.focus()
  }

  // stop invocation of debounced function after unmounting
  useEffect(() => {
    return () => {
      debouncedUpdateTextFilter.cancel()
    }
  }, [debouncedUpdateTextFilter])

  const applyFilters = (queues: any) => {
    setApplyingFilters(true)

    // text filter
    let filteredQueues = Object.values(queues).filter((queue) =>
      searchStringInQueue(queue, textFilter),
    )

    // sort queues
    filteredQueues.sort(sortByProperty('name'))
    filteredQueues.sort(sortByProperty('queue'))

    setFilteredQueues(filteredQueues)
    setApplyingFilters(false)
  }

  // filtered queues
  useEffect(() => {
    applyFilters(queues)
  }, [queues, debouncedTextFilter])

  const areAllQueuesExpanded = () => {
    return Object.values(queues).every((queue: any) => queue.expanded)
  }

  const toggleExpandQueue = (queue: any) => {
    queue.expanded = !queue.expanded
    applyFilters(queues)
  }

  const toggleExpandAllQueues = () => {
    if (areAllQueuesExpanded()) {
      // collapse all queues
      Object.keys(queues).map((key: any) => {
        const queue: any = queues[key]
        queue.expanded = false
      })
    } else {
      // expand all queues
      Object.keys(queues).map((key: any) => {
        const queue: any = queues[key]
        queue.expanded = true
      })
    }
    applyFilters(queues)
  }

  const getQueueOperatorTemplate = (queue: any, key: string, index: number) => {
    const queueOperator = queue.members[key]
    const operatorExtension = queueOperator.member
    const operator: any = getOperatorByPhoneNumber(operatorExtension, operators)

    if (!operator) {
      return
    }

    return (
      <div
        key={index}
        className='flex items-center justify-between px-4 py-2 gap-2 hover:bg-gray-100'
      >
        <div className='flex items-center gap-3 overflow-hidden'>
          <Avatar
            rounded='full'
            src={operator.avatarBase64}
            placeholderType='person'
            size='small'
            status={operator.mainPresence}
          />
          <div className='flex flex-col overflow-hidden'>
            <div className='truncate'>{operator.name}</div>
            <div className='text-gray-500 dark:text-gray-400'>
              {operator.endpoints.mainextension[0].id}
            </div>
          </div>
        </div>
        <div className='shrink-0'>
          <LoggedStatus loggedIn={queueOperator.loggedIn} paused={queueOperator.paused} />
        </div>
      </div>
    )
  }

  return (
    <div className={classNames(className)}>
      <div className='flex justify-between gap-x-4 flex-col-reverse md:flex-row '>
        {/* text filter */}
        <TextInput
          placeholder={t('Queues.Filter queues') || ''}
          value={textFilter}
          onChange={changeTextFilter}
          ref={textFilterRef}
          icon={textFilter.length ? faCircleXmark : undefined}
          onIconClick={() => clearTextFilter()}
          trailingIcon={true}
          className='max-w-sm mb-4'
        />
        <div className='flex flex-col md:items-end mb-3 shrink-0'>
          {/* login/logout and pause buttons */}
          <div>
            <Button variant='white' className='mr-2 mb-2'>
              <FontAwesomeIcon
                icon={faUserXmark}
                className='h-4 w-4 mr-2 text-gray-500 dark:text-gray-400'
              />
              <span>{t('Queues.Logout from all queues')}</span>
              {/*  //// Login to all queues */}
            </Button>
            <Button variant='primary' className='mb-3'>
              <FontAwesomeIcon icon={faPause} className='h-4 w-4 mr-2 text-white dark:text-white' />
              <span>{t('Queues.Pause from all queues')}</span>
            </Button>
          </div>
          {/* expand/collapse all queues */}
          <div
            onClick={() => toggleExpandAllQueues()}
            className='cursor-pointer hover:underline text-sm'
          >
            {areAllQueuesExpanded()
              ? t('Queues.Collapse all queues')
              : t('Queues.Expand all queues')}
          </div>
        </div>
      </div>
      <div className='mx-auto text-center'>
        {/* empty state */}
        {isLoaded && isEmpty(queues) && (
          <EmptyState
            title={t('Queues.No queues')}
            description={t('Queues.You are member of no queues') || ''}
            icon={
              <FontAwesomeIcon icon={faUsers} className='mx-auto h-12 w-12' aria-hidden='true' />
            }
          ></EmptyState>
        )}
        {/* no search results */}
        {isLoaded && !isEmpty(queues) && isEmpty(filteredQueues) && (
          <EmptyState
            title={t('Queues.No queues')}
            description={t('Common.Try changing your search filters') || ''}
            icon={
              <FontAwesomeIcon icon={faFilter} className='mx-auto h-12 w-12' aria-hidden='true' />
            }
          />
        )}
        <ul role='list' className='grid grid-cols-1 gap-6 xl:grid-cols-2 3xl:grid-cols-3'>
          {/* skeleton */}
          {(!isLoaded || isApplyingFilters) &&
            Array.from(Array(3)).map((e, i) => (
              <li
                key={i}
                className='col-span-1 rounded-lg divide-y divide-gray-200 bg-white shadow'
              >
                <div className='p-5 space-y-4'>
                  {Array.from(Array(5)).map((e, j) => (
                    <div
                      key={j}
                      className='animate-pulse h-5 rounded bg-gray-300 dark:bg-gray-600'
                    ></div>
                  ))}
                </div>
              </li>
            ))}
          {/* queues */}
          {isLoaded &&
            !isEmpty(filteredQueues) &&
            Object.keys(filteredQueues).map((key, index) => {
              const queue = filteredQueues[key]
              return (
                <div key={index}>
                  <li className='col-span-1 rounded-lg divide-y divide-gray-200 bg-white shadow'>
                    {/* card header */}
                    <div className='flex flex-col pt-3 pb-5 px-5'>
                      <div className='flex w-full items-center justify-between space-x-6'>
                        <div className='flex-1 truncate'>
                          <div className='flex items-center space-x-2 py-1 text-gray-700'>
                            <h3 className='truncate text-lg leading-6 font-medium'>{queue.name}</h3>
                            <span>{queue.queue}</span>
                            <IconSwitch
                              on={false}
                              size='large'
                              icon={<FontAwesomeIcon icon={faStar} />}
                              changed={() => {}}
                            >
                              <span className='sr-only'>{t('Queues.Toggle favorite queue')}</span>
                            </IconSwitch>
                          </div>
                        </div>
                        <FontAwesomeIcon
                          icon={queue.expanded ? faChevronUp : faChevronDown}
                          className='h-3.5 w-3.5 pl-2 py-2 cursor-pointer'
                          aria-hidden='true'
                          onClick={() => toggleExpandQueue(queue)}
                        />
                      </div>
                      {/* queue stats */}
                      <div className='flex justify-evenly mt-1 text-gray-500 dark:text-gray-400'>
                        <div className='flex items-center gap-2'>
                          <FontAwesomeIcon
                            icon={faPhone}
                            className='h-4 w-4 text-gray-400 dark:text-gray-500'
                            title={t('Queues.Total calls') || ''}
                          />
                          <span>2</span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <FontAwesomeIcon
                            icon={faPause}
                            className='h-4 w-4 text-gray-400 dark:text-gray-500'
                            title={t('Queues.Waiting calls') || ''}
                          />
                          <span>0</span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <FontAwesomeIcon
                            icon={faArrowDownLeftAndArrowUpRightToCenter}
                            className='h-4 w-4 text-gray-400 dark:text-gray-500'
                            title={t('Queues.Connected calls') || ''}
                          />
                          <span>2</span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <FontAwesomeIcon
                            icon={faHeadset}
                            className='h-4 w-4 text-gray-400 dark:text-gray-500'
                            title={t('Queues.Logged agents') || ''}
                          />
                          <span>5</span>
                        </div>
                      </div>
                    </div>
                    {/* card body */}
                    <div className='flex flex-col py-5 px-4'>
                      <div className='flex flex-col xl:flex-row justify-between mb-5'>
                        {/* current operator */}
                        <div className='flex items-center justify-center gap-3 overflow-hidden xl:justify-start mb-4 xl:mb-0'>
                          <Avatar
                            rounded='full'
                            src={avatar}
                            placeholderType='person'
                            size='small'
                            status={mainPresence}
                          />
                          <div className='flex flex-col text-sm overflow-hidden'>
                            <div className='truncate'>{name}</div>
                            <LoggedStatus
                              loggedIn={queue.members[mainextension].loggedIn}
                              paused={queue.members[mainextension].paused}
                            />
                          </div>
                        </div>
                        {/* login/logout and pause buttons */}
                        <div className='shrink-0'>
                          <Button variant='white' className='mr-2'>
                            <FontAwesomeIcon
                              icon={faUserXmark}
                              className='h-4 w-4 mr-2 text-gray-500 dark:text-gray-400'
                            />
                            <span>{t('Queues.Logout')}</span>
                          </Button>
                          <Button variant='white'>
                            <FontAwesomeIcon
                              icon={faPause}
                              className='h-4 w-4 mr-2 text-gray-500 dark:text-gray-400'
                            />
                            <span>{t('Queues.Pause')}</span>
                          </Button>
                        </div>
                      </div>
                      <div className='flex justify-evenly text-sm gap-2 text-gray-500 dark:text-gray-400'>
                        <div>{t('Queues.Min wait')} 00:00:00</div>
                        <div>{t('Queues.Max wait')} 00:00:00</div>
                      </div>
                      {/* expand sections */}
                      {queue.expanded && (
                        <div className='flex flex-col gap-5 mt-5 text-left'>
                          {/* waiting calls */}
                          <div>
                            <div className='flex justify-between items-center'>
                              <div className='font-medium flex items-center'>
                                <FontAwesomeIcon
                                  icon={faPause}
                                  aria-hidden='true'
                                  className='h-4 w-4 mr-2'
                                />
                                <span>{t('Queues.Waiting calls')}</span>
                              </div>
                              <div>
                                {/* //// TODO save expanded to local storage */}
                                <FontAwesomeIcon
                                  icon={faChevronUp}
                                  className='h-3.5 w-3.5 pl-2 py-2 cursor-pointer'
                                  aria-hidden='true'
                                />
                              </div>
                            </div>
                            {/* waiting calls table */}
                            <div className='text-sm'>
                              <div className='p-4 border rounded-md border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200'>
                                {t('Queues.No calls')}
                              </div>
                            </div>
                          </div>
                          {/* connected calls */}
                          <div>
                            <div className='flex justify-between items-center'>
                              <div className='font-medium flex items-center'>
                                <FontAwesomeIcon
                                  icon={faArrowDownLeftAndArrowUpRightToCenter}
                                  aria-hidden='true'
                                  className='h-4 w-4 mr-2'
                                />
                                <span>{t('Queues.Connected calls')}</span>
                              </div>
                              <div>
                                {/* //// TODO save expanded to local storage */}
                                <FontAwesomeIcon
                                  icon={faChevronUp}
                                  className='h-3.5 w-3.5 pl-2 py-2 cursor-pointer'
                                  aria-hidden='true'
                                />
                              </div>
                            </div>
                            {/* connected calls table */}
                            <div className='text-sm'>
                              <div className='p-4 border border-gray-200 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-200'>
                                {t('Queues.No calls')}
                              </div>
                            </div>
                          </div>
                          {/* operators */}
                          {/* //// show only with permissions */}
                          <div>
                            <div className='flex justify-between items-center'>
                              <div className='font-medium flex items-center'>
                                <FontAwesomeIcon
                                  icon={faHeadset}
                                  aria-hidden='true'
                                  className='h-4 w-4 mr-2'
                                />
                                <span>{t('Queues.Queue operators')}</span>
                              </div>
                              <div>
                                {/* //// TODO save expanded to local storage */}
                                <FontAwesomeIcon
                                  icon={faChevronUp}
                                  className='h-3.5 w-3.5 pl-2 py-2 cursor-pointer'
                                  aria-hidden='true'
                                />
                              </div>
                            </div>
                            {/* operators table */}
                            <div className='text-sm'>
                              {isEmpty(queue.members) ? (
                                <div className='p-4 rounded-md text-gray-700 bg-gray-100 dark:text-gray-200 dark:bg-gray-800'>
                                  {t('Queues.No operators')}
                                </div>
                              ) : (
                                <div className='flex flex-col gap-2 border rounded-md max-h-72 overflow-auto border-gray-200 dark:border-gray-700'>
                                  {Object.keys(queue.members).map((key, index) => {
                                    return getQueueOperatorTemplate(queue, key, index)
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </li>
                </div>
              )
            })}
        </ul>
      </div>
    </div>
  )
}

QueuesManagementView.displayName = 'QueuesManagementView'
