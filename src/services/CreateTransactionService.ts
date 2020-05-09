import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const categoryRepository = getRepository(Category);
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const { total } = await transactionsRepository.getBalance();

    if (type === 'outcome' && value > total) {
      throw new AppError(
        `The outcome value can´t be greater than your balance!`,
        400,
      );
    }

    let categoryExists = await categoryRepository.findOne({
      where: {
        title: category,
      },
    });

    let categoryId = null;

    if (!categoryExists) {
      categoryExists = await categoryRepository.create({
        title: category,
      });

      const newCategory = await categoryRepository.save(categoryExists);
      categoryId = newCategory.id;
    }

    categoryId = categoryExists.id;

    const newTransaction = {
      title,
      value,
      type,
      category_id: categoryId,
    };

    const createdTransaction = await transactionsRepository.create(
      newTransaction,
    );

    const transaction = await transactionsRepository.save(createdTransaction);

    return transaction;
  }
}

export default CreateTransactionService;
