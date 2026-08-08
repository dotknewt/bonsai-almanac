export type TaskCategory =
	| 'repot'
	| 'feed'
	| 'prune'
	| 'wire'
	| 'propagate'
	| 'seed'
	| 'pest'
	| 'other';

export interface CareTask {
	id: string;
	title: string;
	startMonth: number;
	startDay: number;
	endMonth: number;
	endDay: number;
	category: TaskCategory;
	description: string;
}

export interface Species {
	id: string;
	name: string;
	botanicalName: string;
	order?: number;
	notes: string;
	tasks: CareTask[];
	/** Path of the vault note this species was parsed from. */
	filePath: string;
}

export interface WindowStatus {
	open: boolean;
	start: Date;
	end: Date;
}
