import { DraftRepository } from "./draft.repository";
import { DraftService } from "./draft.service";
import { SearchService } from "./search.service";

const repository = new DraftRepository();
const searchService = new SearchService();

class DraftServiceProvider {
  private instance: DraftService | null = null;

  get(): DraftService {
    if (!this.instance) {
      this.instance = new DraftService(repository, searchService);
    }
    return this.instance;
  }
}

export const draftServiceProvider = new DraftServiceProvider();
