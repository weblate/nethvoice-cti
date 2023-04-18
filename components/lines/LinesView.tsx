// Copyright (C) 2023 Nethesis S.r.l.
// SPDX-License-Identifier: AGPL-3.0-or-later

import { FC, ComponentProps, useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, EmptyState, InlineNotification, Badge } from '../common'
import { isEmpty, debounce } from 'lodash'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { openShowPhoneLinesDrawer, retrieveLines, PAGE_SIZE } from '../../lib/lines'
import {
  faChevronRight,
  faChevronLeft,
  faFilter,
  faVoicemail,
  faArrowTurnDownRight,
} from '@nethesis/nethesis-solid-svg-icons'
import classNames from 'classnames'
import { LinesFilter } from './LinesFilter'
import { sortByProperty } from '../../lib/utils'

export interface LinesViewProps extends ComponentProps<'div'> {}

export const LinesView: FC<LinesViewProps> = ({ className }): JSX.Element => {
  const { t } = useTranslation()
  const [lines, setLines]: any = useState({})
  const [isLinesLoaded, setLinesLoaded]: any = useState(false)
  const [linesError, setLinesError] = useState('')
  const [pageNum, setPageNum]: any = useState(1)
  const [firstRender, setFirstRender]: any = useState(true)

  const [textFilter, setTextFilter]: any = useState('')
  const updateTextFilter = (newTextFilter: string) => {
    setTextFilter(newTextFilter)
    setLinesLoaded(false)
    setPageNum(1)
  }

  const debouncedUpdateTextFilter = useMemo(() => debounce(updateTextFilter, 400), [])

  // stop invocation of debounced function after unmounting
  useEffect(() => {
    return () => {
      debouncedUpdateTextFilter.cancel()
    }
  }, [debouncedUpdateTextFilter])

  const [dataPagination, setDataPagination]: any = useState({})
  //Get phone lines information
  useEffect(() => {
    if (firstRender) {
      setFirstRender(false)
      return
    }
    async function fetchLines() {
      if (!isLinesLoaded) {
        try {
          setLinesError('')
          const res = await retrieveLines(textFilter.trim(), pageNum, configurationType)

          setLines(res.rows)
          setDataPagination(res)
        } catch (e) {
          console.error(e)
          setLinesError(t('Lines.Cannot retrieve lines') || '')
        }
        setLinesLoaded(true)
      }
    }
    fetchLines()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLinesLoaded, pageNum, firstRender])

  const phoneLines = useSelector((state: RootState) => state.phoneLines)

  useEffect(() => {
    // reload phone lines
    setLinesLoaded(false)
  }, [phoneLines])

  function goToPreviousPage() {
    if (pageNum > 1) {
      setPageNum(pageNum - 1)
      setLinesLoaded(false)
    }
  }

  function goToNextPage() {
    if (pageNum < dataPagination.totalPages) {
      setPageNum(pageNum + 1)
      setLinesLoaded(false)
    }
  }

  function isPreviousPageButtonDisabled() {
    return !isLinesLoaded || pageNum <= 1
  }

  function isNextPageButtonDisabled() {
    return !isLinesLoaded || pageNum >= dataPagination.totalPages
  }

  //set the default sort type
  const [sortBy, setSortBy]: any = useState('description')

  const updateSortFilter = (newSortBy: string) => {
    setSortBy(newSortBy)
  }

  //set the default configuration type
  const [configurationType, setConfigurationType]: any = useState('all')

  const updateConfigurationTypeFilter = (newConfigurationType: string) => {
    setConfigurationType(newConfigurationType)
    setLinesLoaded(false)
  }

  //check if the sort filter is changed
  // if it has changed check the type and reorder the object
  useEffect(() => {
    let newLines = null
    switch (sortBy) {
      case 'description':
        newLines = Array.from(lines).sort(sortByProperty('description'))
        break
      case 'calledIdNum':
        newLines = Array.from(lines).sort(sortByProperty('calledIdNum'))
        break
      default:
        newLines = Array.from(lines)
        break
    }
    setLines(newLines)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, isLinesLoaded])

  // Check which configuration will be shown
  function getConfiguration(configurationType: any) {
    if (
      configurationType.offhour &&
      configurationType.offhour.action &&
      configurationType.offhour.enabled &&
      configurationType.offhour.enabled !== 'never'
    ) {
      switch (configurationType.offhour.action) {
        case 'audiomsg':
          return (
            <>
              <div className='flex items-center'>
                <span>{t(`Lines.Announcement`)}</span>
              </div>
            </>
          )
        case 'audiomsg_voicemail':
          return (
            <>
              <div className='flex items-center'>
                <FontAwesomeIcon icon={faVoicemail} className='h-4 w-4 mr-2' aria-hidden='true' />
                <span>{t(`Lines.Announcement and voicemail`)}</span>
              </div>
            </>
          )
        case 'redirect':
          return (
            <>
              <div className='flex items-center'>
                <FontAwesomeIcon
                  icon={faArrowTurnDownRight}
                  className='h-4 w-4 mr-2'
                  aria-hidden='true'
                />
                <span>{t(`Lines.Forward`)}</span>
              </div>
            </>
          )
        default:
          return (
            <>
              <div className='flex items-center'>
                <span>-</span>
              </div>
            </>
          )
      }
    } else {
      return (
        <>
          <div className='flex items-center'>
            <span>-</span>
          </div>
        </>
      )
    }
  }

  // Creation of the object to be sent to the drawer
  function checkObjectDrawer(lines: any) {
    let objConfigDrawer = {
      datebegin: null,
      dateend: null,
      enabled: false,
      name: null,
      number: null,
      callerNumber: null,
      action: '',
      redirect_to: null,
      announcement_id: null,
      voicemail_id: null,
      dateType: '',
      periodTypology: '',
    }
    if (lines) {
      // calledIdNum, description and callerIdNum no required check
      objConfigDrawer.name = lines.description
      objConfigDrawer.number = lines.calledIdNum
      objConfigDrawer.callerNumber = lines.callerIdNum

      if (lines.offhour) {
        // check if the configuration is enabled
        if (lines.offhour.enabled) {
          if (lines.offhour.enabled !== 'never' && lines.offhour.enabled !== undefined) {
            objConfigDrawer.enabled = true
          } else {
            objConfigDrawer.enabled = false
            objConfigDrawer.periodTypology = 'period'
            objConfigDrawer.dateType = 'specifyDay'
          }
        }
        //action can be 'audiomsg', 'audiomsg_voicemail' or 'redirect'
        objConfigDrawer.action = lines.offhour.action
        //lines.offhour.enabled can be 'never', 'always' or 'period'
        if (lines.offhour.enabled === 'period') {
          // set standard radio button for period equal to 'specifyDay'
          objConfigDrawer.periodTypology = 'period'
          objConfigDrawer.dateType = 'specifyDay'
          //set datebegin and dateend
          objConfigDrawer.datebegin = lines.offhour.period.datebegin
          objConfigDrawer.dateend = lines.offhour.period.dateend
        } else if (lines.offhour.enabled === 'always') {
          objConfigDrawer.periodTypology = 'always'
          objConfigDrawer.dateType = 'always'
        }
        // if action is equal to 'redirect' set input redirect_to
        if (
          lines.offhour.action === 'redirect' &&
          lines.offhour.redirect &&
          lines.offhour.redirect.redirect_to
        ) {
          objConfigDrawer.redirect_to = lines.offhour.redirect.redirect_to
        }
        // if action is equal to 'audiomsg' set input 'audiomsg_id'
        if (lines.offhour.action === 'audiomsg' && lines.offhour.audiomsg) {
          objConfigDrawer.announcement_id = lines.offhour.audiomsg.announcement_id
        }
        // if action is equal to 'audiomsg' set input 'audiomsg_id' and 'voicemail_id'
        if (
          lines.offhour.action === 'audiomsg_voicemail' &&
          lines.offhour.audiomsg &&
          lines.offhour.voicemail
        ) {
          objConfigDrawer.announcement_id = lines.offhour.audiomsg.announcement_id
          objConfigDrawer.voicemail_id = lines.offhour.voicemail.voicemail_id
        }
        // If offhour doesn't exist, set the date to always and the action to never to avoid empty radio button
      } else {
        objConfigDrawer.dateType = 'always'
        objConfigDrawer.action = 'audiomsg'
      }
    }
    openShowPhoneLinesDrawer(objConfigDrawer)
  }

  //Check if the configuration is activate or deactivate
  function getConfigurationStatus(lines: any) {
    if (lines.offhour && lines.offhour.enabled !== 'never') {
      return 'online'
    } else {
      return 'offline'
    }
  }

  return (
    <div className={classNames(className)}>
      <div className='flex flex-col flex-wrap xl:flex-row justify-between gap-x-4 xl:items-end'>
        <LinesFilter
          updateTextFilter={debouncedUpdateTextFilter}
          updateSortFilter={updateSortFilter}
          updateConfigurationTypeFilter={updateConfigurationTypeFilter}
        />
      </div>
      {linesError && <InlineNotification type='error' title={linesError}></InlineNotification>}
      {!linesError && (
        <div className='mx-auto'>
          <div className='flex flex-col overflow-hidden'>
            <div className='-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8'>
              <div className='inline-block min-w-full py-2 align-middle px-2 md:px-6 lg:px-8'>
                <div className='overflow-hidden shadow ring-1 md:rounded-lg ring-opacity-5 dark:ring-opacity-5 ring-gray-900 dark:ring-gray-100'>
                  {/* empty state */}
                  {isLinesLoaded && isEmpty(lines) && (
                    <EmptyState
                      title={t('Lines.No lines')}
                      description={t('Lines.There are no lines with the current filter') || ''}
                      icon={
                        <FontAwesomeIcon
                          icon={faFilter}
                          className='mx-auto h-12 w-12'
                          aria-hidden='true'
                        />
                      }
                      className='bg-white dark:bg-gray-900'
                    ></EmptyState>
                  )}
                  {(!isLinesLoaded || !isEmpty(lines)) && (
                    <table className='min-w-full divide-y divide-gray-300 dark:divide-gray-600'>
                      <thead className='bg-white dark:bg-gray-900'>
                        <tr>
                          <th
                            scope='col'
                            className='py-3.5 pl-4 pr-3 text-left text-sm font-semibold sm:pl-6 text-gray-700 dark:text-gray-200'
                          >
                            {t('Lines.Description')}
                          </th>
                          <th
                            scope='col'
                            className='px-3 py-3.5 text-left text-sm font-semibold text-gray-700 dark:text-gray-200'
                          >
                            {t('Lines.Line number')}
                          </th>
                          <th
                            scope='col'
                            className='px-3 py-3.5 text-left text-sm font-semibold text-gray-700 dark:text-gray-200'
                          >
                            {t('Lines.Caller number')}
                          </th>
                          <th
                            scope='col'
                            className='px-3 py-3.5 text-left text-sm font-semibold text-gray-700 dark:text-gray-200'
                          >
                            {t('Lines.Custom configuration')}
                          </th>
                          <th
                            scope='col'
                            className='px-3 py-3.5 text-left text-sm font-semibold text-gray-700 dark:text-gray-200'
                          >
                            {t('Lines.Configuration status')}
                          </th>
                          {/* <th
                            scope='col'
                            className='px-3 py-3.5 text-left text-sm font-semibold text-gray-700 dark:text-gray-200'
                          >
                            {t('Lines.Rule')}
                          </th> */}

                          <th scope='col' className='relative py-3.5 pl-3 pr-4 sm:pr-6'>
                            <span className='sr-only'>{t('Lines.Details')}</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className=' text-sm divide-y divide-gray-200 bg-white text-gray-700 dark:divide-gray-700 dark:bg-gray-900 dark:text-gray-200'>
                        {/* skeleton */}
                        {!isLinesLoaded &&
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

                        {/* lines */}
                        {isLinesLoaded &&
                          Object.keys(lines).map((key) => (
                            <tr
                              key={key}
                              className='cursor-pointer'
                              onClick={() => {
                                checkObjectDrawer(lines[key])
                              }}
                            >
                              {/* Description */}
                              <td className='py-4 pl-4 pr-3 sm:pl-6'>
                                {lines[key].description ? lines[key].description : '-'}{' '}
                              </td>
                              {/* Phone line */}
                              <td className='px-3 py-4'>
                                <div className='flex flex-col'>
                                  <div>
                                    <div>
                                      {lines[key].calledIdNum ? lines[key].calledIdNum : '-'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              {/* Caller number */}
                              <td className='px-3 py-4'>
                                <div>{lines[key].callerIdNum ? lines[key].callerIdNum : '-'}</div>
                              </td>
                              {/* Costum configuration */}
                              <td className='whitespace-nowrap px-3 py-4'>
                                {getConfiguration(lines[key])}
                              </td>
                              {/* Configuration status */}
                              <td className='whitespace-nowrap px-3 py-4'>
                                <Badge variant={getConfigurationStatus(lines[key])} rounded='full'>
                                  {' '}
                                  {lines[key].offhour && lines[key].offhour.enabled !== 'never'
                                    ? t('Lines.Active')
                                    : t('Lines.Not active')}
                                </Badge>
                              </td>
                              {/* Rule */}
                              {/* <td className='whitespace-nowrap px-3 py-4'>
                                <div className='flex items-center'>
                                  <span>
                                    {lines[key].offhour && lines[key].offhour.audiomsg
                                      ? lines[key].offhour.audiomsg.description
                                      : '-'}
                                  </span>
                                </div>
                              </td> */}

                              {/* Show details */}
                              <td className='relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6'>
                                <FontAwesomeIcon
                                  icon={faChevronRight}
                                  className='h-3 w-3 p-2 cursor-pointer text-gray-500 dark:text-gray-500'
                                  aria-hidden='true'
                                  onClick={() => {
                                    checkObjectDrawer(lines[key])
                                  }}
                                />
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* pagination */}
          {!linesError && !!lines?.length && (
            <nav
              className='flex items-center justify-between border-t px-0 py-4 mb-8 border-gray-100 dark:border-gray-800'
              aria-label='Pagination'
            >
              <div className='hidden sm:block'>
                <p className='text-sm text-gray-700 dark:text-gray-200'>
                  {t('Common.Showing')}{' '}
                  <span className='font-medium'>{PAGE_SIZE * (pageNum - 1) + 1}</span> -&nbsp;
                  <span className='font-medium'>
                    {PAGE_SIZE * (pageNum - 1) + PAGE_SIZE < dataPagination?.count
                      ? PAGE_SIZE * (pageNum - 1) + PAGE_SIZE
                      : dataPagination?.count}
                  </span>{' '}
                  {t('Common.of')} <span className='font-medium'>{dataPagination?.count}</span>{' '}
                  {t('Lines.Lines')}
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
        </div>
      )}
    </div>
  )
}

LinesView.displayName = 'LinesView'