import { Command } from 'commander';
import { CloudFormationBinder } from '../cfn-binder/cfn-binder';
import { ConsoleUtil } from '../console-util';
import { OrgFormationError } from '../org-formation-error';
import { TemplateRoot } from '../parser/parser';
import { BaseCliCommand, ICommandArgs } from './base-command';

const commandName = 'print-stacks <templateFile>';
const commandDescription = 'outputs cloudformation templates generated by org-formation to the console';

export class PrintStacksCommand extends BaseCliCommand<IPrintStacksCommandArgs> {

    constructor(command: Command) {
        super(command, commandName, commandDescription, 'templateFile');
    }

    public addOptions(command: Command) {
        command.option('--parameters [parameters]', 'parameter values passed to cloudformation when executing stacks');
        command.option('--stack-name <stack-name>', 'name of the stack that will be used in cloudformation', 'print');
        super.addOptions(command);
    }

    public async performCommand(command: IPrintStacksCommandArgs) {
        if (!command.stackName) {
            throw new OrgFormationError(`argument --stack-name is missing`);
        }
        const templateFile = command.templateFile;
        const template = TemplateRoot.create(templateFile);
        const state = await this.getState(command);
        const cfnBinder = new CloudFormationBinder(command.stackName, template, state);

        const bindings = cfnBinder.enumBindings();
        for (const binding of bindings) {
            if (binding.action === 'Delete') {
                ConsoleUtil.LogInfo(`stack ${command.stackName} for account ${binding.accountId} and region ${binding.region} will be deleted`);
                continue;
            }
            console.log(`template for account ${binding.accountId} and region ${binding.region}`);
            const templateBody = binding.template.createTemplateBody();
            console.log(templateBody);
        }
    }
}

interface IPrintStacksCommandArgs extends ICommandArgs {
    templateFile: string;
    stackName: string;
}
