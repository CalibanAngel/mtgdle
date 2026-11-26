import { AdminService } from '../../packages/api/src/api/admin/admin.service';

describe('Administrative jobs', () => {
  const prepare = jest.fn();
  const importer = jest.fn();
  let service: AdminService;
  beforeEach(() => {
    prepare.mockReset();
    importer.mockReset();
    service = new AdminService(
      {} as never,
      { prepare } as never,
      {} as never,
      { importAll: importer } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
  });
  const finished = () => new Promise((resolve) => setImmediate(resolve));
  it('should reuse the catalogue service in check mode when a verification job runs', async () => {
    prepare.mockResolvedValue({ cards: 42, selectedNames: 50 });
    expect(service.start({ operation: 'catalogue:check' }).status).toBe(
      'running',
    );
    await finished();
    expect(prepare).toHaveBeenCalledWith(true);
    expect(service.jobs()[0]).toMatchObject({
      status: 'succeeded',
      error: null,
    });
    expect(service.jobs()[0].result).toContain('42');
  });
  it('should prevent a second job when another operation is running', async () => {
    let resolve: (value: object) => void;
    prepare.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    service.start({ operation: 'catalogue:prepare' });
    expect(() => service.start({ operation: 'catalogue:check' })).toThrow(
      'déjà en cours',
    );
    await finished();
    resolve!({ cards: 1 });
    await finished();
    expect(service.jobs()[0].status).toBe('succeeded');
  });
  it('should retain a safe error message when an existing service fails', async () => {
    const logger = jest.spyOn(console, 'error').mockImplementation(() => {});
    prepare.mockRejectedValue(new Error('private-database-detail'));
    service.start({ operation: 'catalogue:prepare' });
    await finished();
    expect(service.jobs()[0].status).toBe('failed');
    expect(service.jobs()[0].error).not.toContain('private-database-detail');
    logger.mockRestore();
  });
  it('should reuse the full importer with local data when the import job runs', async () => {
    importer.mockResolvedValue({ cards: { totalItems: 100 } });
    service.start({ operation: 'scryfall:import' });
    await finished();
    expect(importer).toHaveBeenCalledWith(true, true);
  });
});
