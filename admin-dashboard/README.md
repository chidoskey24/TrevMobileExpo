# TrevMobile Admin Dashboard

A local web dashboard for managing TrevMobile drivers and monitoring system status.

## Features

### Driver Management
- View all registered drivers
- Monitor driver status (active/inactive/pending)
- View driver statistics (total paid, transactions, last payment)
- Activate/deactivate drivers
- Real-time driver activity monitoring

### Payment Monitoring
- View all payment receipts
- Monitor transaction status (paid/queued/failed)
- Track payment methods and amounts
- View transaction history

### Transaction Queue Management
- Monitor queued transactions
- View processing status
- Track offline payments
- Manage failed transactions

### System Status
- Database health monitoring
- Blockchain network status
- Mobile app connection status
- Real-time system metrics

## Usage

1. Open `index.html` in your web browser
2. The dashboard will load with mock data for demonstration
3. Use the tabs to navigate between different sections
4. Click the refresh button (↻) to update data
5. Use action buttons to manage drivers

## Data Integration

To connect with real mobile app data:

1. **Database Connection**: Modify the JavaScript to connect to your SQLite database
2. **API Integration**: Create API endpoints to serve data from the mobile app
3. **Real-time Updates**: Implement WebSocket or polling for live updates
4. **Authentication**: Add admin authentication for security

## File Structure

```
admin-dashboard/
├── index.html          # Main dashboard file
├── README.md          # This documentation
└── assets/            # CSS, JS, and image files (if needed)
```

## Customization

### Adding New Features
1. Add new tabs in the HTML
2. Create corresponding JavaScript functions
3. Update the `showTab()` function
4. Add new data structures to `mockData`

### Styling
- Modify the CSS in the `<style>` section
- Use CSS variables for consistent theming
- Responsive design included for mobile devices

### Data Sources
- Replace `mockData` with real API calls
- Implement error handling for network requests
- Add loading states and error messages

## Security Considerations

- This is a local dashboard - ensure proper authentication
- Validate all user inputs
- Implement rate limiting for API calls
- Use HTTPS in production environments
- Regular security audits recommended

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive design
- No external dependencies required
- Works offline with cached data

## Development

To extend the dashboard:

1. **Add New Tabs**: 
   ```html
   <div class="tab" onclick="showTab('newtab')">New Tab</div>
   ```

2. **Create Tab Content**:
   ```html
   <div id="newtab-tab" class="tab-content">
       <!-- Content here -->
   </div>
   ```

3. **Add JavaScript Handler**:
   ```javascript
   function loadNewTab() {
       // Load data for new tab
   }
   ```

4. **Update Tab Switching**:
   ```javascript
   case 'newtab':
       loadNewTab();
       break;
   ```

## Production Deployment

For production use:

1. **Web Server**: Deploy to a web server (Apache, Nginx, etc.)
2. **Database**: Connect to production database
3. **API**: Implement secure API endpoints
4. **Authentication**: Add admin login system
5. **SSL**: Enable HTTPS for security
6. **Monitoring**: Add logging and error tracking

## Support

For issues or questions:
- Check browser console for errors
- Verify data format matches expected structure
- Test with different browsers
- Review network requests in developer tools
