import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IExecuteFunctions,
	IDataObject,
	ILoadOptionsFunctions,
	INodePropertyOptions,
	IRequestOptions,
} from 'n8n-workflow';

const host = 'https://staging.fetchfox.ai';

export class FetchFox implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'FetchFox AI Scraper',
		name: 'fetchFox',
		icon: 'file:fox.svg',
		group: ['transform'],
		version: 1,
		description: 'Scrape data with FetchFox',
		subtitle: '={{$parameter["resource"]}}',
		defaults: {
			name: 'FetchFox'
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'fetchFoxApi',
				required: true,
			},
		],

		// Basic node details will go here

		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				// type: 'options',
				type: 'hidden',
				noDataExpression: true,
				options: [
					{
						name: 'Crawl',
						value: 'crawl',
					},
					{
						name: 'Extract',
						value: 'extract',
					},
					{
						name: 'Scraper',
						value: 'scraper',
					},
					{
						name: 'Pre-Built Scraper',
						value: 'template',
					},
				],
				default: 'crawl',
			},

			// Crawl operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				// type: 'hidden',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['crawl'],
					},
				},
				options: [
					{
						name: 'Find URLs Using AI Prompt',
						value: 'prompt',
						action: 'Find pages using a prompt',
					},
					{
						name: 'Find URLs Matching a URL Pattern',
						value: 'pattern',
						action: 'Find pages matching a pattern',
					},
				],
				default: 'prompt',
			},

			// Crawl options
			{
				displayName: 'Starting URL for Crawl',
				description: 'FetchFox will start here and look for links',
				name: 'url',
				type: 'string',
				default: '',
				placeholder: 'https://www.example.com/directory/page-1',
				required: true,
				displayOptions: {
					show: {
						resource: ['crawl'],
						operation: ['prompt'],
					},
				},
			},
			{
				displayName: 'Crawl Prompt for AI',
				description: 'FetchFox will find URLs based on this prompt',
				name: 'query',
				type: 'string',
				default: '',
				placeholder: 'Example: "Look for links to profile pages"',
				required: true,
				displayOptions: {
					show: {
						resource: ['crawl'],
						operation: ['prompt'],
					},
				},
			},

			{
				displayName: 'URL Pattern to Find. Include at Least One * Wildcard',
				description: 'FetchFox find URLs matching this pattern. For example, https://www.example.com/directory/*. Pattern must have at least on * in it',
				name: 'url',
				type: 'string',
				default: '',
				placeholder: 'https://www.example.com/directory/*',
				required: true,
				displayOptions: {
					show: {
						resource: ['crawl'],
						operation: ['pattern'],
					},
				},
			},
			{
				displayName: 'Get HTML, Text, and Markdown?',
				description: 'If you select "yes", we will get the page HTML, and also convert it into text and markdown',
				name: 'pull',
				type: 'options',
				options: [
					{
						name: 'Yes, Get HTML, Text, and Markdown (Slower)',
						value: 'yes',
					},
					{
						name: 'No, only Get the URLs (Faster)',
						value: 'no',
					},
				],
				default: 'no',
				required: true,
				displayOptions: {
					show: {
						resource: ['crawl'],
						operation: ['pattern'],
					},
				},
			},

			// Extract operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				// type: 'hidden',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['extract'],
					},
				},
				options: [
					{
						name: 'Extract a Single Item per URL',
						value: 'single',
						action: 'Extract a single item per URL',
					},
					{
						name: 'Extract Multiple Items per URL',
						value: 'multiple',
						action: 'Extract multiple items per URL',
					},
				],
				default: 'single',
			},

			// Extract options
			{
				displayName: 'Target URL for Extraction',
				description: 'Enter the URL from which you\'d like to scrape data',
				name: 'url',
				type: 'string',
				default: '',
				placeholder: 'https://www.example.com/directory/page-1',
				required: true,
				displayOptions: {
					show: {
						resource: ['extract'],
					},
				},
			},

			{
				displayName: 'Data to Extract',
				name: 'fields',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				placeholder: 'Add data field to extract',
				default: {},
				description: 'These fields will be extracted from the target pages',
				displayOptions: {
					show: {
						resource: ['extract'],
					},
				},

				options: [
					{
						displayName: '',
						name: 'extractField',
						values: [
							{
								displayName: 'Field Name',
								name: 'name',
								type: 'string',
								required: true,
								default: '',
								description: 'Name the field',
								placeholder: 'eg. "title"',
								hint: 'Enter the name of the field you want to extract',
							},
							{
								displayName: 'Field Description',
								name: 'description',
								type: 'string',
								required: true,
								default: '',
								description: 'Describe the data you are extracting',
								placeholder: 'eg. "Title of the post"',
								hint: 'Tell the AI what data it should extract',
							},
						],
					},
				],
			},

			// Scraper operations
			{
				displayName: 'Operation',
				name: 'operation',
				// type: 'options',
				type: 'hidden',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['scraper'],
					},
				},
				options: [
					{
						name: 'Run One of Your Saved Scrapers',
						value: 'saved',
						action: 'Run one of your saved scrapers',
					},
				],
				default: 'saved',
			},

			// Scraper options
			{
				displayName: 'Select Scraper Name or ID',
				description: 'Which scraper would you like data from?. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
				name: 'scrapeId',
				default: '',
				required: true,
				noDataExpression: true,

				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getScrapes',
				},

				displayOptions: {
					show: {
						resource: ['scraper'],
					},
				},
			},
			{
				displayName: 'New Run, or Just Get Latest Results? Name or ID',
				noDataExpression: true,
				description: 'Do you want to do new run of this scraper, or simply pull the results from the most recent run?. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>.',
				name: 'mode',
				default: '',
				required: true,

				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getModes',
					loadOptionsDependsOn: ['scrapeId'],
				},

				displayOptions: {
					show: {
						resource: ['scraper'],
					},
				},
			},

			// Template operations
			{
				displayName: 'Operation',
				name: 'operation',
				// type: 'options',
				type: 'hidden',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['template'],
					},
				},
				options: [
					{
						name: 'Run Pre-Built Reddit Comments Scraper',
						value: 'reddit',
						action: 'Run pre-built Reddit comments scraper',
					},
					{
						name: 'Run Pre-Built Google Maps Email Scraper',
						value: 'googleMaps',
						action: 'Run pre-built Google Maps email scraper',
					},
					{
						name: 'Run Pre-Built LinkedIn Jobs Scraper',
						value: 'linkedIn',
						action: 'Run pre-built LinkedIn jobs scraper',
					},
				],
				default: 'reddit',
			},

			// Template options
			{
				displayName: 'Reddit comments scraper takes about 1-3 minutes to run',
				name: 'redditNotice',
				type: 'notice',
				default: '',
				displayOptions: {
					show: {
						resource: ['template'],
						operation: ['reddit'],
					},
				},
			},
			{
				displayName: 'Google Maps email scraper takes about 2-4 minutes to run. Will make best effort to find emails, but will not always succeed.',
				name: 'googleMapsNotice',
				type: 'notice',
				default: '',
				displayOptions: {
					show: {
						resource: ['template'],
						operation: ['googleMaps'],
					},
				},
			},
			{
				displayName: 'LinkedIn jobs scraper takes about 2-4 minutes to run.',
				name: 'linkedInNotice',
				type: 'notice',
				default: '',
				displayOptions: {
					show: {
						resource: ['template'],
						operation: ['linkedIn'],
					},
				},
			},

			{
				displayName: 'Sub-Reddit, Eg. "r/CryptoMarkets"',
				description: 'Which sub-reddit would you like to scrape? You MUST include "r/" prefix',
				name: 'subreddit',
				type: 'string',
				default: '',
				placeholder: 'Example: "r/CryptoMarkets"',
				displayOptions: {
					show: {
						resource: ['template'],
						operation: ['reddit'],
					},
				},
			},

			{
				displayName: 'Location to Scrape',
				description: 'What location would you like to scrape?',
				name: 'location',
				type: 'string',
				default: '',
				placeholder: 'Example: "London, UK"',
				displayOptions: {
					show: {
						resource: ['template'],
						operation: ['googleMaps', 'linkedIn'],
					},
				},
			},

			{
				displayName: 'Search Keyword',
				description: 'What keyword would like search for in your scrape?',
				name: 'keyword',
				type: 'string',
				default: '',
				placeholder: 'Example: "marketing"',
				displayOptions: {
					show: {
						resource: ['template'],
						operation: ['googleMaps', 'linkedIn'],
					},
				},
			},

			// Globally available
			{
				displayName: 'Max Number of Results',
				description: 'Max number of results to return',
				name: 'limit',
				default: 50,
				required: true,
				type: 'number',
				typeOptions: {
					minValue: 1,
				},

				displayOptions: {
					show: {
						resource: ['scraper', 'crawl', 'extract', 'template'],
					},
				},
			},
		],
	};

	methods = {
		loadOptions: {
			getScrapes,
			getModes,
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const data = this.getExecuteData();

		const { resource, operation } = data.node.parameters;

		switch (`${resource}:${operation}`) {
			case 'crawl:pattern': return executeCrawlPattern(this);
			case 'crawl:prompt': return executeCrawlPrompt(this);

			case 'extract:single': return executeExtractSingle(this);
			case 'extract:multiple': return executeExtractMultiple(this);

			case 'scraper:saved': return executeScraperSaved(this);

			case 'template:reddit': return executeTemplateReddit(this);
			case 'template:googleMaps': return executeTemplateGoogleMaps(this);
			case 'template:linkedIn': return executeTemplateLinkedIn(this);
		}

		return [];
	}
}

async function executeCrawlPattern(ex: IExecuteFunctions): Promise <INodeExecutionData[][]> {
	const d = ex.getExecuteData();
	const { limit, pull } = d.node.parameters;
	const constStep = getConstStep(ex);

	const workflow = {
		options: { limit },
		steps: [
			constStep,
			{
				name: 'crawl',
				args: { pull: pull == 'yes' },
			},
		],
	};

	return runWorkflow(ex, workflow);
}

async function executeCrawlPrompt(ex: IExecuteFunctions): Promise <INodeExecutionData[][]> {
	const d = ex.getExecuteData();
	const { limit, query } = d.node.parameters;
	const constStep = getConstStep(ex);

	console.log('query', query);

	const workflow = {
		options: { limit },
		steps: [
			constStep,
			{ name: 'crawl', args: { query } },
		],
	};

	return runWorkflow(ex, workflow);
}

async function executeExtractSingle(ex: IExecuteFunctions): Promise <INodeExecutionData[][]> {
	const { limit } = ex.getExecuteData().node.parameters;
	const constStep = getConstStep(ex);
	const extractStep = getExtractStep(ex, 'single');

	const workflow = {
		options: { limit },
		steps: [
			constStep,
			extractStep,
		],
	};

	return runWorkflow(ex, workflow);
}

async function executeExtractMultiple(ex: IExecuteFunctions): Promise <INodeExecutionData[][]> {
	const { limit } = ex.getExecuteData().node.parameters;
	const constStep = getConstStep(ex);
	const extractStep = getExtractStep(ex, 'multiple');

	const workflow = {
		options: { limit },
		steps: [
			constStep,
			extractStep,
		],
	};

	return runWorkflow(ex, workflow);
}

async function executeScraperSaved(ex: IExecuteFunctions): Promise <INodeExecutionData[][]> {
	const d = ex.getExecuteData();
	const { limit, scrapeId, mode } = d.node.parameters;

	console.log('limit, scrapeId, mode', limit, scrapeId, mode);

	if (mode == 'latest') {
		const resp = await ex.helpers.requestWithAuthentication.call(
			ex,
			'fetchFoxApi',
			{
				method: 'GET',
				uri: `https://fetchfox.ai/api/v2/results/${scrapeId}/latest`,
				json: true,
			});
		const items = resp?.results || []
		return [ex.helpers.returnJsonArray(cleanItems(items))];

	} else {
		const resp = await ex.helpers.requestWithAuthentication.call(
			ex,
			'fetchFoxApi',
			{
				method: 'POST',
				uri: `${host}/api/v2/scrapes/${scrapeId}/run`,
				json: true,
				body: { limit },
			});
		const jobId = resp.jobId;
	  return resultsForJob(ex, jobId);
	}
}

async function executeTemplateReddit(ex: IExecuteFunctions): Promise <INodeExecutionData[][]> {
	const d = ex.getExecuteData();
	let { limit, subreddit } = d.node.parameters;

	if (subreddit && !('' + subreddit).startsWith('r/')) {
		subreddit = 'r/' + subreddit;
	}

	const workflow = {
		options: { limit },
		steps: [
			{
				"name": "const",
				"args": {
					"items": [
						{
							"url": "https://old.reddit.com/" + subreddit
						}
					],
					"maxPages": 1,
				}
			},
			{
				"name": "crawl",
				"args": {
					"query": "Look for links to thread pages. Ignore navigation links, links to user profiles, and advertisements.",
					"maxPages": 3
				}
			},
			{
				"name": "extract",
				"args": {
					"questions": {
						"username": "What is the username of the commenter?",
						"points": "What is the number of points for the comment?",
						"comment": "What is the comment body? Limit to 500 words.",
						"url": "What is the permalink URL of the comment?"
					},
					"mode": "multiple",
					"view": "html",
					"maxPages": 1
				}
			}
		],
	};

	return runWorkflow(ex, workflow);
}

async function executeTemplateGoogleMaps(ex: IExecuteFunctions): Promise <INodeExecutionData[][]> {
	const d = ex.getExecuteData();
	let { limit, location, keyword } = d.node.parameters;
	console.log('gmaps', limit, location, keyword);

	const workflow = {
		options: { limit },
		steps: [
			{
				"name": "const",
				"args": {
					"items": [
						{
							"url": `https://www.google.com/maps/search/${keyword}+near+${location}/`
						}
					],
					"maxPages": 1,
				}
			},
			{
				"name": "extract",
				"args": {
					"questions": {
						"name": "What is the name of this company?",
						"url": "What is the official website of this company? Find the off-site URL, *not* the Google places URLFormat: full absolute URL",
						"address": "The full address of the company"
					},
					"single": false,
					"maxPages": 1
				}
			},
			{
				"name": "extract",
				"args": {
					"questions": {
						"email": "Find the email for the company, if one exists. If none found, return blank"
					},
					"single": true,
					"view": "html",
					"examples": null,
					"limit": null,
					"maxPages": 1,
					"mode": "single"
				}
			}
		],
	};

	return runWorkflow(ex, workflow);
}

async function executeTemplateLinkedIn(ex: IExecuteFunctions): Promise <INodeExecutionData[][]> {
	const d = ex.getExecuteData();
	let { limit, location, keyword } = d.node.parameters;
	console.log('gmaps', limit, location, keyword);

	const workflow = {
		options: { limit },
		steps: [
			{
				"name": "const",
				"args": {
					"items": [
						{
							"url": `https://www.linkedin.com/jobs/search?keywords=${keyword}&location=${location}`,
						}
					],
					"maxPages": 1
				}
			},
			{
				"name": "extract",
				"args": {
					"questions": {
						"job_title": "What is the job title?",
						"company_name": "What is the name of the company?",
						"location": "What is the job location?",
						"posting_date": "What is the posting date?",
						"salary_range": "What is the salary range of this job?",
						"url": "What is the URL of to view this job listing? Format: Absolute URL"
					},
					"mode": "multiple",
					"view": "html",
					"maxPages": 1,
				}
			},
			{
				"name": "extract",
				"args": {
					"questions": {
						"applicant_count": "How many applicants are there?",
						"salary_range": "What is the salary range of this job?",
						"industries": "What is the Industries for this job?",
						"job_function": "What is the job function for this job?",
						"seniority_level": "What is the seniority level for this job?"
					},
					"mode": "single",
					"view": "html",
					"maxPages": 1
				}
			}
		],
	};

	return runWorkflow(ex, workflow);
}

async function runWorkflow(ex: IExecuteFunctions, workflow: any): Promise <INodeExecutionData[][]> {
	console.log('workflow', JSON.stringify(workflow, null, 2));
	const workflowResp = await ex.helpers.requestWithAuthentication.call(
		ex,
		'fetchFoxApi',
		{
			method: 'POST',
			uri: `${host}/api/v2/workflows`,
			json: true,
			body: workflow,
		});
	console.log('resp', workflowResp);
	const workflowId = workflowResp.id;

	const runResp = await ex.helpers.requestWithAuthentication.call(
		ex,
		'fetchFoxApi',
		{
			method: 'POST',
			uri: `${host}/api/v2/workflows/${workflowId}/run`,
			json: true,
		});
	console.log('run resp', runResp);
	const jobId = runResp.jobId;
	return resultsForJob(ex, jobId);
}

async function resultsForJob(ex: IExecuteFunctions, jobId: string): Promise <INodeExecutionData[][]> {
	const items: IDataObject[] = await new Promise<IDataObject[]>(async (ok) => {
		let count = 0;
		const poll = async () => {
			console.log('poll', count++, jobId);
			let resp;
			try {
				resp = await ex.helpers.requestWithAuthentication.call(
					ex,
					'fetchFoxApi',
					{
						method: 'GET',
						uri: `https://fetchfox.ai/api/v2/jobs/${jobId}`,
						json: true,
					});
			} catch (e) {
				console.log('fetch error:', e);
			}

			const items = resp.results?.items || [];
			console.log('poll got:', items.length);
			if (resp?.done) {
				ok(cleanItems(items));
			} else {
				setTimeout(poll, 1000);
			}
		}
		await poll();
	});
	console.log('results', items);

	return [ex.helpers.returnJsonArray(items)];
}

async function getModes(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {

	const params = this.getCurrentNodeParameters();
	const options = [{
		name: 'Run Scraper',
		description: 'May take a few minutes or more',
		value: 'run',
	}];

	if (params?.scrapeId) {
		const scrapeId = params.scrapeId;

		const resp = await this.helpers.requestWithAuthentication.call(
			this,
			'fetchFoxApi',
			{
				method: 'GET',
				uri: `https://fetchfox.ai/api/v2/results/${scrapeId}/latest`,
				json: true,
			});

		const len = (resp?.results || []).length;
		console.log('latest len', len);
		if (len) {
			options.push({
				name: 'Use latest results',
				description: 'Fast, useful for testing. Results will not change unless you re-run the scraper from FetchFox.',
				value: 'latest',
			});
		}
	}

	return options;
}

async function getScrapes(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {

	const options: IRequestOptions = {
		headers: {
			'Accept': 'application/json',
		},
		method: 'GET',
		uri: `https://fetchfox.ai/api/v2/scrapes`,
		json: true,
	};

	const resp = await this.helpers.requestWithAuthentication.call(
		this, 'fetchFoxApi', options);

	const results = [];
	for (const item of resp.results) {
		results.push({
			name: item.name,
			value: item.id,
			description: item.description,
		})
	}

	return results;
}

type Item = { [key: string]: any };
function cleanItems(items: Item[]): Item[] {
  return items.map(item => {
    const clean: Item = {};
    for (const key in item) {
      if (!key.startsWith('_')) {
        clean[key] = item[key];
      }
    }
	  if (!clean.url && item._url) {
		  clean.url = item._url;
	  }
    return clean;
  });
}

function getConstStep(ex: IExecuteFunctions): any {
	const { url } = ex.getExecuteData().node.parameters;

	const constStep: any = {
		name: 'const',
		args: {
			items: [],
		},
	};

	const inp = ex.getInputData();
	let index = 0;
	for (const it of inp) {
		console.log('it ', it);
		let val = ('' + ex.evaluateExpression(String(url), index++));
		if (val) {
			val = val.replace(/^=/, '');
			console.log('val', val);
			constStep.args.items.push({ url: val });
		}
	}
	if (!index) {
		constStep.args.items.push({ url });
	}
	return constStep;
}

function getExtractStep(ex: IExecuteFunctions, mode: string): any {
	const { fields } = ex.getExecuteData().node.parameters;
	const questions: { [key: string]: string } = {};
	if (fields) {
		const f = (fields as { extractField: any }).extractField;
		for (const field of f) {
			questions[field.name] = field.description;
		}
	}
	return {
		name: 'extract',
		args: {
			questions,
			mode,
		},
	};
}
