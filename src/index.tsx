import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './index.css';
import registerServiceWorker from './registerServiceWorker';

import axios from 'axios';
import { Container, Form, FormGroup, FormInput, DropdownItemProps, Dropdown, FormField, FormButton, Table, TableHeader, TableRow, TableHeaderCell, TableBody, TableCell, FormProps, InputOnChangeData, Label, DimmerDimmable, Dimmer, Loader, Header } from 'semantic-ui-react';
import 'semantic-ui-css/semantic.min.css';

const fieldStyle = {
  marginBottom: '1rem'
}

interface Problem {
  userName: string;
  contestTitle: string;
  problemTitle: string;
  url: string;
  point: number;
}

interface State {
  contestTitle: { [key: string]: string }; // id => title
  problemTitle: { [key: string]: string }; // id => title
  userName: string;
  sucCount: number;
  randomFetching: boolean;
  problems: Problem[];
  problemLB: number;
  problemUB: number;
  hasError: boolean;
}

class Application extends React.Component<{}, State> {
  private points: number[] = [];
  private options: DropdownItemProps[] = [];
  constructor(props: {}) {
    super(props);
    for (let i = 0; i <= 2500; i += 100) {
      this.points.push(i);
      this.options.push({ key: i, text: String(i), value: i });
    }
    this.state = { contestTitle: {}, problemTitle: {}, userName: '', sucCount: 0, randomFetching: false, problems: [], problemLB: 0, problemUB: 2500, hasError: false };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleClick = this.handleClick.bind(this);
  }

  public componentWillMount() {
    axios.get('https://kenkoooo.com/atcoder/atcoder-api/info/contests')
      .then((results) => {
        const contestTitle: { [key: string]: string } = {}; // const?
        results.data.forEach((contest: any) => {
          contestTitle[contest.id] = contest.title;
        });
        const newCount = this.state.sucCount + 1;
        this.setState({ contestTitle, sucCount: newCount });
      }).catch((err) => {
        console.log('error');
        console.error(err);
      });

    axios.get('https://kenkoooo.com/atcoder/atcoder-api/info/problems')
      .then((results) => {
        // console.log(results);
        const problemTitle: { [key: string]: string } = {};
        results.data.forEach((problem: any) => {
          problemTitle[problem.id] = problem.title;
        });
        const newCount = this.state.sucCount + 1;
        this.setState({ problemTitle, sucCount: newCount });
      }).catch((err) => {
        console.log('error');
        console.error(err);
      });
  }

  public render() {
    const isLoading = this.state.sucCount < 2;
    return (
      <Container style={{ margin: '2rem' }}>
        <DimmerDimmable dimmed={isLoading}>
          <Header as={'h1'} dividing={true}>
            <span onClick={this.handleClick} style={{ cursor: 'pointer' }}> Second AC </span>
          </Header>
          <Dimmer active={isLoading} inverted={true}>
            <Loader>Loading...</Loader>
          </Dimmer>
          <Form onSubmit={this.handleSubmit}>
            <FormGroup>
              <FormField style={fieldStyle}>
                <FormInput placeholder={'Username'} name={'input'} onChange={this.handleChange} value={this.state.userName} />
              </FormField>
              <FormField style={fieldStyle}>
                <Dropdown placeholder={'lowerbound'} search={true} selection={true} options={this.options} onChange={this.handleChange} value={this.state.problemLB} />
                <Label content={'lowerbound'} pointing={true} />
              </FormField>
              <FormField style={fieldStyle}>
                <Dropdown placeholder={'upperbound'} search={true} selection={true} options={this.options} onChange={this.handleChange} value={this.state.problemUB} />
                <Label content={'upperbound'} pointing={true} />
              </FormField>
              <FormField style={fieldStyle}>
                <FormButton content={'Submit'} loading={this.state.randomFetching} disabled={this.state.randomFetching} />
              </FormField>
            </FormGroup>
          </Form>
          <Table basic={true} unstackable={true}>
            <TableHeader>
              <TableRow>
                <TableHeaderCell textAlign={'center'}>ユーザ名</TableHeaderCell>
                <TableHeaderCell textAlign={'center'}>問題</TableHeaderCell>
                <TableHeaderCell textAlign={'center'}>得点</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {this.state.problems.map((problem, idx) => {
                return (
                  <TableRow key={idx}>
                    <TableCell textAlign={'center'}>{problem.userName}</TableCell>
                    <TableCell>
                      <a href={problem.url} target={'_blank'}>
                        {problem.contestTitle} {problem.problemTitle}
                      </a>
                    </TableCell>
                    <TableCell textAlign={'center'}>{problem.point}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </DimmerDimmable>
      </Container>
    );
  }

  private handleSubmit(event: React.FormEvent<HTMLFormElement>, data: FormProps) {
    event.preventDefault();
    this.setState({ randomFetching: true });
    const uri = 'https://kenkoooo.com/atcoder/atcoder-api/results?user=' + this.state.userName;
    axios.get(uri)
      .then((results) => {
        if (results.data.length > 0) {
          const validProblems = results.data.filter((problem: any) => {
            return (
              this.state.problemLB <= problem.point &&
              problem.point <= this.state.problemUB &&
              problem.result === 'AC'
            );
          });
          const len = validProblems.length;
          const randomOne = validProblems[Math.floor(Math.random() * len)];
          const contestId = randomOne.contest_id;
          const problemId = randomOne.problem_id;
          const contestTitle = this.state.contestTitle[contestId];
          const problemTitle = this.state.problemTitle[problemId];
          const newProblem = [{
            userName: this.state.userName,
            contestTitle,
            problemTitle,
            url: `https://beta.atcoder.jp/contests/${contestId}/tasks/${problemId}`,
            point: randomOne.point
          }];
          const problems = newProblem.concat(this.state.problems);
          this.setState({ randomFetching: false, problems });
        }else{
          this.setState({ randomFetching: false });
        }
      }).catch((err) => {
        console.log('error');
        console.error(err);
        this.setState({ randomFetching: false });
      });
  }

  private handleChange(event: React.SyntheticEvent<HTMLInputElement>, data: InputOnChangeData) {
    if (data.name === 'input') {
      this.setState({ userName: data.value });
    } else {
      if (data.placeholder === 'lowerbound') {
        this.setState({ problemLB: (Number)(data.value) });
      } else {
        this.setState({ problemUB: (Number)(data.value) });
      }
    }
  }

  private handleClick(event: React.MouseEvent<HTMLElement>) { // これでいいのか
    this.setState({
      userName: '',
      randomFetching: false,
      problems: [],
      problemLB: 0,
      problemUB: 2500,
      hasError: false
    });
  }
}

ReactDOM.render(
  <Application />,
  document.getElementById('root') as HTMLElement
);
registerServiceWorker();
