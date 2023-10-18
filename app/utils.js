/*
 * Copyright 2023 New Relic Corporation. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { faker } from '@faker-js/faker'

// Date on which Jordi first received this interview challenge
faker.setDefaultRefDate(new Date('2023-10-16'))

const methodCodesArr = ['12', '34', '56', '78', null]
const statuses = ['Pending', 'Posted']

function generateTransactions(count) {
  return new Array(count).fill(0).map(() => {
    return {
      date: faker.date.past(),
      amount: faker.number.int({ min: -500, max: 1000 }),
      status: faker.helpers.arrayElement(statuses),
      counterPartyName: faker.person.fullName(),
      methodCode: faker.helpers.arrayElement(methodCodesArr),
      // 25% of transactions should have a note
      note: faker.datatype.boolean({ probability: 0.25 }) ? faker.lorem.words(20) : null
    }
  })
}

const methodNames = {
  12: 'Card Purchase',
  34: 'ACH',
  56: 'Wire',
  78: 'Fee'
}

// Yeah, a little silly to be writing this backwards manually, but a
// little repetition doesn't hurt.
const methodCodes = {
  'Card Purchase': '12',
  ACH: '34',
  Wire: '56',
  Fee: '78'
}

export { generateTransactions, methodNames, methodCodes }
