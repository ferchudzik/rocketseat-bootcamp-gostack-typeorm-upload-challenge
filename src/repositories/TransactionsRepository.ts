import { EntityRepository, Repository, getRepository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactionsRepository = getRepository(Transaction);

    const transactions = await transactionsRepository.find();

    const balance = transactions.reduce<Balance>(
      (currentBalance, currentTransaction) => {
        return currentTransaction.type === 'income'
          ? {
              ...currentBalance,
              income: currentBalance.income + currentTransaction.value,
              total: currentBalance.total + currentTransaction.value,
            }
          : {
              ...currentBalance,
              outcome: currentBalance.outcome + currentTransaction.value,
              total: currentBalance.total - currentTransaction.value,
            };
      },
      { income: 0, outcome: 0, total: 0 },
    );

    return balance;
  }
}

export default TransactionsRepository;
