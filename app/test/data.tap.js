import { t as tap } from 'tap'
import { generateTransactions } from '../utils.js'
import { faker } from '@faker-js/faker'

// This seems like a good seed, gives us a diverse enough set of
// transactions
faker.seed(1234)

tap.test('check generated transactions', (t) => {
  const txns = generateTransactions(10)
  t.equal(txns.length, 10, 'should get 10 transactions')
  const balance = txns.reduce((sum, x) => sum + x.amount, 0)
  t.equal(balance, 4960, 'balance should be 4960')
  t.end()
})
