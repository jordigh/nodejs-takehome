/*
 * Copyright 2023 New Relic Corporation. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import DataLoader from 'dataloader'
import { getTransactionById } from './datastore.js'

const loaders = () => ({
  getTransactionById: new DataLoader(
    (ids) => {
      return Promise.all(ids.map((id) => getTransactionById(id)))
    },
    {
      batchScheduleFn: (callback) => setTimeout(callback, 100)
    }
  )
})

const getContext = () => {
  return {
    loaders: loaders()
  }
}

export default getContext
