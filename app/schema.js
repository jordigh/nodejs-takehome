/*
 * Copyright 2023 New Relic Corporation. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { buildSchema } from 'graphql'

const transactionSchema = buildSchema(`
  type Query {
    transaction(id: ID!): Transaction
    allTransactions: [Transaction]
    allTransactionsByMethod(methodName: String!): [Transaction]
    balance: Int
  }

  enum Status {
    Pending
    Posted
  }
  
  type Mutation {
    addTransaction(
      date: String!, 
      amount: Int!, 
      status: String!, 
      counterPartyName: String!,
      methodCode: String,
      note: String
    ): ID
    updateTransaction(id: ID!, amount: Int, note: String): Boolean
    deleteTransaction(id: ID!): Boolean
  }

  type Transaction {
    id: ID!
    date: String!
    # Amount in cents, to avoid fractional values (21 million dollars
    # ought to be enough for anyone)
    amount: Int!
    status: Status!
    counterPartyName: String!
    methodName: String!
    # Even though the codes are numbers, they are not used for their
    # numerical value. Just like you don't want phone numbers to be
    # rounded or added or any other numerical things, we want these
    # codes to be treated stringily.
    methodCode: String
    note: String
  }
`)

export default transactionSchema
