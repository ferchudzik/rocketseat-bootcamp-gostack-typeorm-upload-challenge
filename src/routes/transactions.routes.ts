import { Router } from 'express';
import multer from 'multer';
import { getCustomRepository } from 'typeorm';
import { mapSeries } from 'async';
import uploadConfig from '../config/upload';

import Transaction from '../models/Transaction';

import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';

const transactionsRouter = Router();

const upload = multer(uploadConfig);

transactionsRouter.get('/', async (request, response) => {
  const transactionsRepository = getCustomRepository(TransactionsRepository);

  const transactions = await transactionsRepository.find();
  const balance = await transactionsRepository.getBalance();

  response.json({ transactions, balance });
});

transactionsRouter.post('/', async (request, response) => {
  const { title, value, type, category } = request.body;

  const createTransactionService = new CreateTransactionService();

  const createdTransaction = await createTransactionService.execute({
    title,
    value,
    type,
    category,
  });

  response.json(createdTransaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params;

  const deleteTransactionService = new DeleteTransactionService();

  await deleteTransactionService.execute({ id });

  response.json({
    message: 'OK',
  });
});

transactionsRouter.post(
  '/import',
  upload.single('file'),
  async (request, response) => {
    const { filename } = request.file;

    const importTransactionsService = new ImportTransactionsService();
    const createTransactionService = new CreateTransactionService();

    const transactionsToCreate = await importTransactionsService.execute({
      filename,
    });

    const transactions: Transaction[] = await mapSeries(
      transactionsToCreate,
      async (transaction, callback) => {
        const newTransaction = await createTransactionService.execute({
          title: transaction.title,
          type: transaction.type,
          value: transaction.value,
          category: transaction.category_id,
        });
        return callback(null, newTransaction);
      },
    );

    return response.json(transactions);
  },
);

export default transactionsRouter;
